import { z } from "zod";

import type {
  PromptAnalyticsEntry,
  SortField,
  SortOrder,
  Tenant,
  PromptSuggestion,
  DashboardOverviewResponse,
  DashboardStats,
  UsageTrendPoint,
  TopPromptSummary
} from "../../shared/types";
import {
  authenticateRequest,
  generateSessionTokens,
  verifyPassword,
  fetchUserByEmailWithPassword,
  authenticateRefreshToken,
  invalidateRefreshToken,
  AuthContext,
  requirePermission,
  ensureTenantAccess,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
  buildAuthContext,
  fetchUser,
  fetchRoleAssignments,
  hasPermission,
  generateBearerToken
} from "./auth";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_TENANT_ID,
  MAX_PAGE_SIZE,
  MAX_TENANT_ID_LENGTH,
  MAX_USER_IDENTIFIER_LENGTH
} from "./constants";
import type { Env } from "./types";
import { createLogger, type Logger } from "./lib/logger";
import { jsonResponse, readJson, serializeError } from "./lib/json";
import { clearListCache, buildPromptCacheKey } from "./lib/cache";
import { ensureTenant, resolveTenantId } from "./lib/tenant";
import { fetchPrompt, recordPromptVersion, invalidatePromptCaches } from "./lib/prompts";
import { enforceRateLimit } from "./lib/rateLimit";
import { fetchPromptSuggestions } from "./lib/search";
import {
  bulkArchivePrompts,
  bulkCreatePrompts,
  bulkDeletePrompts,
  bulkManageTags,
  bulkUpdatePrompts
} from "./lib/bulk";
import {
  exportPromptsCSV,
  exportPromptsJSON,
  importPrompts,
  parseCSVToJSON,
  previewImport
} from "./lib/import-export";
import {
  TEMPLATE_LIBRARY,
  getTemplateFromLibrary,
  getTemplatesByCategory,
  parseTemplate,
  renderTemplate,
  searchTemplateLibrary,
  validateRenderRequest,
  validateTemplate
} from "./lib/templates";
import { getOpenAPIDocument } from "./openapi";
import { getSwaggerUIHTML } from "./lib/swagger";
import {
  normalizeVersionedPath,
  getRequestedVersion,
  addVersionHeaders,
  isVersionSupported
} from "./lib/versioning";
import { addSecurityHeaders } from "./lib/securityHeaders";
import {
  createPrompt as createPromptService,
  deletePrompt as deletePromptService,
  getPrompt as getPromptService,
  listPromptVersions as listPromptVersionsService,
  listPrompts as listPromptsService,
  recordPromptUsage as recordPromptUsageService,
  updatePrompt as updatePromptService,
  type PromptListQueryOptions,
  type UpdatePromptData
} from "./services/promptService";
import {
  addPromptComment,
  addPromptShare,
  listPromptComments,
  listPromptShares,
  removePromptComment,
  removePromptShare,
  requestApproval,
  updateApproval,
  updatePromptComment,
  listPromptApprovals,
  listPromptActivity,
  listUserNotifications,
  markNotificationAsRead
} from "./services/collaborationService";
import type { ApprovalStatus } from "./repositories/approvalRepository";

const tenantIdSchema = z
  .string()
  .min(1)
  .max(MAX_TENANT_ID_LENGTH)
  .regex(/^[a-zA-Z0-9_-]+$/, "Tenant identifier must be alphanumeric, dashes or underscores");

const userIdentifierSchema = z.string().min(1).max(MAX_USER_IDENTIFIER_LENGTH);

const createPromptSchema = z.object({
  tenantId: tenantIdSchema.default(DEFAULT_TENANT_ID),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  tags: z.array(z.string().min(1).max(64)).max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  archived: z.boolean().optional(),
  createdBy: userIdentifierSchema.optional()
});

const updatePromptSchema = createPromptSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

const createTenantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, or hyphens"),
  createdBy: userIdentifierSchema.optional()
});

const usageEventSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional()
});

const commentCreateSchema = z.object({
  body: z.string().min(1),
  parentId: z.string().min(1).optional()
});

const commentUpdateSchema = z
  .object({
    body: z.string().min(1).optional(),
    resolved: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "No updates provided");

const shareCreateSchema = z.object({
  targetType: z.enum(["user", "email", "tenant"]),
  targetIdentifier: z.string().min(1).max(256),
  role: z.enum(["viewer", "editor", "approver"]),
  expiresAt: z.string().datetime({ offset: true }).optional()
});

const approvalCreateSchema = z.object({
  approver: z.string().min(1).max(MAX_USER_IDENTIFIER_LENGTH),
  message: z.string().max(1000).optional()
});

const approvalUpdateSchema = z.object({
  status: z.enum(["approved", "rejected", "changes_requested", "pending"] as const),
  message: z.string().max(1000).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

const bearerTokenSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  expiresIn: z.number().min(300).max(86400).optional() // 5 minutes to 24 hours
});

const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(200),
  roleId: z.string().min(1),
  tenantId: tenantIdSchema.optional().nullable()
});

const corsHeaders = new Headers({
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
});

const sortColumns: Record<SortField, string> = {
  created_at: "created_at",
  updated_at: "updated_at",
  title: "title COLLATE NOCASE"
};

const CACHE_WARM_INTERVAL_MS = 15 * 60 * 1000;
const CACHE_WARM_KEY = "meta:cache:last-warm";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  const clone = new Date(date);
  clone.setUTCHours(0, 0, 0, 0);
  return clone;
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function isoString(date: Date): string {
  return date.toISOString();
}

function isoDateStamp(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function getActorFromAuth(auth: AuthContext): string {
  return auth.user.email || auth.user.id;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const logger = createLogger(env.LOG_LEVEL);
    const requestId = crypto.randomUUID();
    const start = Date.now();
    const url = new URL(request.url);
    const originalPath = url.pathname.replace(/\/$/, "") || "/";

    // Handle API versioning - normalize path and extract version
    const { normalizedPath, version: pathVersion } = normalizeVersionedPath(originalPath);
    const apiVersion = getRequestedVersion(request, originalPath);
    const path = normalizedPath;

    // Check if version is supported (only for versioned paths)
    if (pathVersion && !isVersionSupported(pathVersion)) {
      return withCors(
        jsonResponse({ error: `API version ${pathVersion} is not supported` }, 400),
        request,
        env
      );
    }

    if (request.method === "OPTIONS") {
      logger.debug("request.options", { requestId, method: request.method, path: originalPath });
      return withCors(new Response(null, { status: 204, headers: corsHeaders }), request, env);
    }

    logger.info("request.start", {
      requestId,
      method: request.method,
      path: originalPath,
      apiVersion
    });

    ctx.waitUntil(warmCacheIfNeeded(env, logger));

    try {
      if (request.method !== "OPTIONS") {
        const rateLimit = await enforceRateLimit(request, env, logger, requestId);
        if (rateLimit) {
          const finalResponse = withCors(rateLimit.response, request, env);
          logger.warn("request.rate_limited", {
            requestId,
            method: request.method,
            path: originalPath,
            status: finalResponse.status,
            durationMs: Date.now() - start,
            clientId: rateLimit.clientId,
            limit: rateLimit.limit,
            windowSeconds: rateLimit.windowSeconds
          });
          return finalResponse;
        }
      }

      const isLoginRoute = path === "/auth/login" && request.method === "POST";
      const isRefreshRoute = path === "/auth/refresh" && request.method === "POST";
      const isLogoutRoute = path === "/auth/logout" && request.method === "POST";
      let auth: AuthContext | null = null;

      // Enforce CSRF for state-changing requests when cookies (credentials) are used.
      // Read allowed origins from env.ALLOWED_ORIGINS (comma-separated). If present,
      // only those origins are permitted for requests with credentials.
      const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
      const hasCredentials = request.headers.get("cookie") ? true : false;
      if (
        hasCredentials &&
        mutatingMethods.has(request.method) &&
        !isLoginRoute &&
        !isRefreshRoute &&
        !isLogoutRoute
      ) {
        const csrfHeader = request.headers.get("x-csrf-token") || "";
        const cookieHeader = request.headers.get("cookie") || "";
        const cookieMatch = cookieHeader
          .split(";")
          .map((s) => s.trim())
          .find((c) => c.startsWith("pm_csrf="));
        const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch.split("=")[1] || "") : "";
        if (!csrfHeader || !cookieVal || csrfHeader !== cookieVal) {
          throw jsonResponse({ error: "CSRF validation failed" }, 403);
        }
      }

      if (!isLoginRoute && !isRefreshRoute && !isLogoutRoute) {
        auth = await authenticateRequest(request, env);
      }

      let response: Response | undefined;

      if (path === "/healthz" && request.method === "GET") {
        response = jsonResponse({ status: "ok" });
      } else if (isLoginRoute) {
        response = await handleLogin(request, env);
      } else if (isRefreshRoute) {
        response = await handleRefresh(request, env);
      } else if (isLogoutRoute) {
        response = await handleLogout(request, env);
      } else if (path === "/auth/bearer-token" && request.method === "POST") {
        response = await handleBearerTokenCreate(request, env, auth);
      } else if (path === "/openapi.json" && request.method === "GET") {
        response = jsonResponse(getOpenAPIDocument());
      } else if (path === "/api-docs" && request.method === "GET") {
        response = new Response(getSwaggerUIHTML(), {
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      } else if (path === "/auth/me" && request.method === "GET") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        response = jsonResponse({
          data: {
            user: auth.user,
            roles: auth.roles
          }
        });
      } else if (path === "/tenants") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        if (request.method === "GET") {
          requirePermission(auth, "prompt:read");
          response = await handleTenantList(env, auth);
        } else if (request.method === "POST") {
          requirePermission(auth, "tenant:manage");
          response = await handleTenantCreate(request, env, auth);
        }
      } else if (path === "/analytics/overview" && request.method === "GET") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        const tenantResolution = await resolveTenantId(request, url, env, {
          allowDefault: true,
          requireTenant: true
        });
        ensureTenantAccess(auth, tenantResolution.tenantId);
        requirePermission(auth, "analytics:read", tenantResolution.tenantId);
        response = await handleAnalyticsOverview(env, tenantResolution.tenantId, url);
      } else if (path === "/analytics/prompts" && request.method === "GET") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        const tenantResolution = await resolveTenantId(request, url, env, {
          allowDefault: true,
          requireTenant: true
        });
        ensureTenantAccess(auth, tenantResolution.tenantId);
        requirePermission(auth, "analytics:read", tenantResolution.tenantId);
        response = await handlePromptAnalytics(env, tenantResolution.tenantId, url);
      } else if (path === "/api-keys" && request.method === "GET") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        requirePermission(auth, "api-key:manage");
        response = await handleApiKeyList(env, auth);
      } else if (path === "/api-keys" && request.method === "POST") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        requirePermission(auth, "api-key:manage");
        response = await handleApiKeyCreate(request, env, auth);
      } else if (path.startsWith("/api-keys/")) {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        requirePermission(auth, "api-key:manage");
        const rotateMatch = path.match(/^\/api-keys\/([^/]+)\/rotate$/);
        const deleteMatch = path.match(/^\/api-keys\/([^/]+)$/);
        if (rotateMatch && request.method === "POST") {
          const apiKeyId = rotateMatch[1];
          response = await handleApiKeyRotate(env, auth, apiKeyId);
        } else if (deleteMatch && request.method === "DELETE") {
          const apiKeyId = deleteMatch[1];
          response = await handleApiKeyRevoke(env, auth, apiKeyId);
        }
      } else if (path.startsWith("/prompts")) {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        if (request.method === "POST" && path === "/prompts/bulk/create") {
          response = await handleBulkCreatePromptsRequest(request, env, auth, url, logger, ctx);
        } else if (request.method === "POST" && path === "/prompts/bulk/update") {
          response = await handleBulkUpdatePromptsRequest(request, env, auth, url, logger, ctx);
        } else if (request.method === "POST" && path === "/prompts/bulk/delete") {
          response = await handleBulkDeletePromptsRequest(request, env, auth, url, logger, ctx);
        } else if (request.method === "POST" && path === "/prompts/bulk/tags") {
          response = await handleBulkManageTagsRequest(request, env, auth, url, logger, ctx);
        } else if (request.method === "POST" && path === "/prompts/bulk/archive") {
          response = await handleBulkArchivePromptsRequest(request, env, auth, url, logger, ctx);
        } else if (request.method === "POST" && path === "/prompts/import/preview") {
          response = await handlePromptsImportPreview(request, env, auth, url);
        } else if (request.method === "POST" && path === "/prompts/import") {
          response = await handlePromptsImport(request, env, auth, url, logger, ctx);
        } else if (request.method === "GET" && path === "/prompts/export") {
          response = await handlePromptsExport(request, env, auth, url);
        } else if (request.method === "GET" && path === "/prompts/search/suggestions") {
          const tenantResolution = await resolveTenantId(request, url, env, {
            allowDefault: true,
            requireTenant: true
          });
          ensureTenantAccess(auth, tenantResolution.tenantId);
          requirePermission(auth, "prompt:read", tenantResolution.tenantId);
          response = await handlePromptSuggestions(url, env, tenantResolution.tenantId);
        } else if (request.method === "GET" && path === "/prompts") {
          const tenantResolution = await resolveTenantId(request, url, env, {
            allowDefault: true,
            requireTenant: true
          });
          ensureTenantAccess(auth, tenantResolution.tenantId);
          requirePermission(auth, "prompt:read", tenantResolution.tenantId);
          response = await handleList(url, env, tenantResolution.tenantId, logger, ctx);
        } else if (request.method === "POST" && path === "/prompts") {
          response = await handleCreate(request, env, auth, logger, ctx);
        } else {
          const commentsMatch = path.match(/^\/prompts\/([^/]+)\/comments$/);
          const sharesMatch = path.match(/^\/prompts\/([^/]+)\/shares$/);
          const shareDeleteMatch = path.match(/^\/prompts\/([^/]+)\/shares\/([^/]+)$/);
          const approvalsMatch = path.match(/^\/prompts\/([^/]+)\/approvals$/);
          const activityMatch = path.match(/^\/prompts\/([^/]+)\/activity$/);
          const versionMatch = path.match(/^\/prompts\/([^/]+)\/versions$/);
          const usageMatch = path.match(/^\/prompts\/([^/]+)\/usage$/);
          const idMatch = path.match(/^\/prompts\/([^/]+)$/);

          if (commentsMatch) {
            const promptId = commentsMatch[1];
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);

            if (request.method === "GET") {
              requirePermission(auth, "prompt:read", tenantResolution.tenantId);
              const comments = await listPromptComments(env, promptId, tenantResolution.tenantId);
              response = jsonResponse({ data: comments });
            } else if (request.method === "POST") {
              requirePermission(auth, "prompt:write", tenantResolution.tenantId);
              const payload = commentCreateSchema.parse(await readJson(request));
              const actor = getActorFromAuth(auth);
              const comment = await addPromptComment(env, {
                promptId,
                tenantId: tenantResolution.tenantId,
                parentId: payload.parentId ?? null,
                body: payload.body,
                actor
              });
              response = jsonResponse({ data: comment }, 201);
            }
          } else if (sharesMatch) {
            const promptId = sharesMatch[1];
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);

            if (request.method === "GET") {
              requirePermission(auth, "prompt:read", tenantResolution.tenantId);
              const shares = await listPromptShares(env, promptId, tenantResolution.tenantId);
              response = jsonResponse({ data: shares });
            } else if (request.method === "POST") {
              requirePermission(auth, "prompt:write", tenantResolution.tenantId);
              const payload = shareCreateSchema.parse(await readJson(request));
              const actor = getActorFromAuth(auth);
              const shares = await addPromptShare(env, {
                promptId,
                tenantId: tenantResolution.tenantId,
                targetType: payload.targetType,
                targetIdentifier: payload.targetIdentifier,
                role: payload.role,
                actor,
                expiresAt: payload.expiresAt ?? null
              });
              response = jsonResponse({ data: shares }, 201);
            }
          } else if (shareDeleteMatch && request.method === "DELETE") {
            const promptId = shareDeleteMatch[1];
            const shareId = shareDeleteMatch[2];
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);
            requirePermission(auth, "prompt:write", tenantResolution.tenantId);
            const actor = getActorFromAuth(auth);
            const shares = await removePromptShare(
              env,
              promptId,
              tenantResolution.tenantId,
              shareId,
              actor
            );
            response = jsonResponse({ data: shares });
          } else if (approvalsMatch) {
            const promptId = approvalsMatch[1];
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);

            if (request.method === "GET") {
              requirePermission(auth, "prompt:read", tenantResolution.tenantId);
              const approvals = await listPromptApprovals(env, promptId, tenantResolution.tenantId);
              response = jsonResponse({ data: approvals });
            } else if (request.method === "POST") {
              requirePermission(auth, "prompt:write", tenantResolution.tenantId);
              const payload = approvalCreateSchema.parse(await readJson(request));
              const actor = getActorFromAuth(auth);
              const approvals = await requestApproval(env, {
                promptId,
                tenantId: tenantResolution.tenantId,
                approver: payload.approver,
                message: payload.message ?? null,
                actor
              });
              response = jsonResponse({ data: approvals }, 201);
            }
          } else if (activityMatch && request.method === "GET") {
            const promptId = activityMatch[1];
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);
            requirePermission(auth, "prompt:read", tenantResolution.tenantId);
            const activity = await listPromptActivity(env, promptId, tenantResolution.tenantId);
            response = jsonResponse({ data: activity });
          } else if (versionMatch && request.method === "GET") {
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);
            requirePermission(auth, "prompt:read", tenantResolution.tenantId);
            response = await handleListVersions(
              versionMatch[1],
              env,
              tenantResolution.tenantId,
              url
            );
          } else if (usageMatch && request.method === "POST") {
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);
            requirePermission(auth, "prompt:write", tenantResolution.tenantId);
            response = await handleRecordUsage(
              usageMatch[1],
              request,
              env,
              tenantResolution.tenantId
            );
          } else if (idMatch) {
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: request.method === "GET"
            });
            const tenantId = tenantResolution?.tenantId;

            if (request.method === "GET") {
              if (tenantId) {
                ensureTenantAccess(auth, tenantId);
                requirePermission(auth, "prompt:read", tenantId);
              }
              response = await handleRetrieve(idMatch[1], env, tenantId, auth);
            } else if (request.method === "PUT") {
              response = await handleUpdate(idMatch[1], request, env, auth, logger, ctx);
            } else if (request.method === "DELETE") {
              response = await handleDelete(idMatch[1], env, tenantId, auth, logger, ctx);
            }
          }
        }
      } else if (path.startsWith("/comments")) {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        const commentMatch = path.match(/^\/comments\/([^/]+)$/);
        if (commentMatch) {
          const commentId = commentMatch[1];
          if (request.method === "PATCH") {
            const payload = commentUpdateSchema.parse(await readJson(request));
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);
            requirePermission(auth, "prompt:write", tenantResolution.tenantId);
            const actor = getActorFromAuth(auth);
            const comment = await updatePromptComment(
              env,
              commentId,
              tenantResolution.tenantId,
              actor,
              payload
            );
            response = jsonResponse({ data: comment });
          } else if (request.method === "DELETE") {
            const tenantResolution = await resolveTenantId(request, url, env, {
              allowDefault: true,
              requireTenant: true
            });
            ensureTenantAccess(auth, tenantResolution.tenantId);
            requirePermission(auth, "prompt:write", tenantResolution.tenantId);
            const actor = getActorFromAuth(auth);
            await removePromptComment(env, commentId, tenantResolution.tenantId, actor);
            response = jsonResponse({ success: true });
          }
        }
      } else if (path.startsWith("/approvals")) {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        const approvalMatch = path.match(/^\/approvals\/([^/]+)$/);
        if (approvalMatch && request.method === "PATCH") {
          const payload = approvalUpdateSchema.parse(await readJson(request));
          const tenantResolution = await resolveTenantId(request, url, env, {
            allowDefault: true,
            requireTenant: true
          });
          ensureTenantAccess(auth, tenantResolution.tenantId);
          requirePermission(auth, "prompt:write", tenantResolution.tenantId);
          const actor = getActorFromAuth(auth);
          const approval = await updateApproval(
            env,
            approvalMatch[1],
            tenantResolution.tenantId,
            actor,
            payload.status as ApprovalStatus,
            payload.message ?? null
          );
          response = jsonResponse({ data: approval });
        }
      } else if (path === "/notifications" && request.method === "GET") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        const actor = getActorFromAuth(auth);
        const notifications = await listUserNotifications(env, actor);
        response = jsonResponse({ data: notifications });
      } else if (path.startsWith("/notifications/") && request.method === "PATCH") {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }
        const match = path.match(/^\/notifications\/([^/]+)$/);
        if (match) {
          const actor = getActorFromAuth(auth);
          const notification = await markNotificationAsRead(env, match[1], actor);
          response = jsonResponse({ data: notification });
        }
      } else if (path.startsWith("/templates")) {
        if (!auth) {
          throw jsonResponse({ error: "Unauthorized" }, 401);
        }

        if (request.method === "POST" && path === "/templates/render") {
          response = await handleTemplateRender(request, env, auth, url);
        } else if (request.method === "POST" && path === "/templates/validate") {
          response = await handleTemplateValidate(request, env, auth);
        } else if (request.method === "POST" && path === "/templates/variables") {
          response = await handleTemplateVariables(request, env, auth);
        } else if (request.method === "GET" && path === "/templates/library") {
          response = await handleTemplateLibraryList(auth, url);
        } else if (request.method === "GET" && path.startsWith("/templates/library/category/")) {
          response = await handleTemplateLibraryByCategory(auth, path);
        } else if (request.method === "GET" && path.startsWith("/templates/library/search")) {
          response = await handleTemplateLibrarySearch(auth, url);
        } else if (request.method === "GET" && path.startsWith("/templates/library/")) {
          response = await handleTemplateLibraryRetrieve(auth, path);
        }
      }

      if (!response) {
        response = jsonResponse({ error: "Not Found" }, 404);
      }

      const responseWithVersion = addVersionHeaders(response, apiVersion);
      const finalResponse = withCors(responseWithVersion, request, env);
      logger.info("request.complete", {
        requestId,
        method: request.method,
        path: originalPath,
        apiVersion,
        status: finalResponse.status,
        durationMs: Date.now() - start
      });
      return finalResponse;
    } catch (error) {
      if (error instanceof Response) {
        const errorWithVersion = addVersionHeaders(error, apiVersion);
        const finalResponse = withCors(errorWithVersion, request, env);
        logger.warn("request.handled_error", {
          requestId,
          method: request.method,
          path: originalPath,
          status: finalResponse.status
        });
        return finalResponse;
      }

      logger.error("request.unhandled_error", {
        requestId,
        method: request.method,
        path: originalPath,
        error: serializeError(error)
      });
      return withCors(jsonResponse({ error: "Internal Server Error" }, 500));
    }
  }
};

function withCors(response: Response, request?: Request, env?: Env): Response {
  // Add CORS headers
  const headers = new Headers(response.headers);
  const requestOrigin = request?.headers.get("origin") || headers.get("origin") || "*";

  // Check allowed origins if configured
  let finalOrigin = "*";
  const allowedOrigins = env?.ALLOWED_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (requestOrigin !== "*") {
    if (!allowedOrigins?.length) {
      // No origin whitelist - echo back the origin
      finalOrigin = requestOrigin;
    } else if (allowedOrigins.includes(requestOrigin)) {
      // Origin is in whitelist
      finalOrigin = requestOrigin;
    } else {
      // Origin not in whitelist - return * if not using credentials
      const hasCredentials = request?.headers.get("cookie") ? true : false;
      if (hasCredentials) {
        // Block the request if credentials are used with non-whitelisted origin
        throw jsonResponse({ error: "Origin not allowed" }, 403);
      }
      finalOrigin = "*";
    }
  }

  corsHeaders.forEach((value, key) => headers.set(key, value));
  headers.set("Access-Control-Allow-Origin", finalOrigin);
  if (finalOrigin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  const responseWithCors = new Response(response.body, {
    status: response.status,
    headers
  });

  // Add security headers
  return addSecurityHeaders(responseWithCors, {
    enableHSTS: true,
    enableCSP: true,
    enableCORP: true,
    enableCOEP: false // Disabled for compatibility
  });
}

async function handleList(
  url: URL,
  env: Env,
  tenantId: string,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenant = await ensureTenant(env, tenantId);

  const search = url.searchParams.get("search") || undefined;
  const tag = url.searchParams.get("tag") || undefined;
  const metadataKey = url.searchParams.get("metadataKey") || undefined;
  const metadataValue = url.searchParams.get("metadataValue") || undefined;

  const sortBy = (url.searchParams.get("sortBy") as SortField | null) || "created_at";
  const sortField = sortColumns[sortBy] ? sortBy : "created_at";

  const orderParam = url.searchParams.get("order") as SortOrder | null;
  const sortOrder: "ASC" | "DESC" = orderParam === "asc" ? "ASC" : "DESC";

  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10));
  const requestedPageSize = Number.parseInt(
    url.searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
    10
  );
  const pageSize = Math.min(Math.max(1, requestedPageSize || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const options: PromptListQueryOptions = {
    tenantId: tenant.id,
    search,
    tag,
    metadataKey,
    metadataValue,
    sortField,
    sortOrder,
    page,
    pageSize,
    offset
  };

  const payload = await listPromptsService(env, options, logger, ctx);
  return jsonResponse(payload);
}

async function handleCreate(
  request: Request,
  env: Env,
  auth: AuthContext,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const data = await readJson(request);
  const parsed = createPromptSchema.parse(data);

  const tenant = await ensureTenant(env, parsed.tenantId);

  ensureTenantAccess(auth, tenant.id);
  requirePermission(auth, "prompt:write", tenant.id);

  const createdBy = parsed.createdBy ?? auth.user.email ?? auth.user.id ?? null;

  const prompt = await createPromptService(
    env,
    {
      tenantId: tenant.id,
      title: parsed.title,
      body: parsed.body,
      tags: parsed.tags ?? [],
      metadata: parsed.metadata ?? null,
      archived: parsed.archived ?? false,
      createdBy
    },
    logger,
    ctx
  );
  return jsonResponse({ data: prompt }, 201);
}

async function handleRetrieve(
  id: string,
  env: Env,
  tenantId: string | undefined,
  auth: AuthContext
): Promise<Response> {
  const targetTenantId = tenantId ?? DEFAULT_TENANT_ID;
  const prompt = await getPromptService(env, id, targetTenantId);
  if (!prompt) {
    return jsonResponse({ error: "Prompt not found" }, 404);
  }
  ensureTenantAccess(auth, prompt.tenantId);
  requirePermission(auth, "prompt:read", prompt.tenantId);
  return jsonResponse({ data: prompt });
}

async function handleUpdate(
  id: string,
  request: Request,
  env: Env,
  auth: AuthContext,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const data = await readJson(request);
  const parsed = updatePromptSchema.parse(data);

  const existing = await getPromptService(env, id);
  if (!existing) {
    return jsonResponse({ error: "Prompt not found" }, 404);
  }

  if (parsed.tenantId && parsed.tenantId !== existing.tenantId) {
    return jsonResponse({ error: "Cannot move prompt between tenants" }, 400);
  }

  const tenant = await ensureTenant(env, existing.tenantId);

  ensureTenantAccess(auth, tenant.id);
  requirePermission(auth, "prompt:write", tenant.id);

  const updates: UpdatePromptData = {};
  if (parsed.title !== undefined) updates.title = parsed.title;
  if (parsed.body !== undefined) updates.body = parsed.body;
  if (parsed.tags !== undefined) updates.tags = parsed.tags;
  if (parsed.metadata !== undefined) updates.metadata = parsed.metadata ?? null;
  if (parsed.archived !== undefined) updates.archived = parsed.archived;
  if (parsed.createdBy !== undefined) updates.createdBy = parsed.createdBy ?? null;

  const prompt = await updatePromptService(env, existing, updates, logger, ctx);
  return jsonResponse({ data: prompt });
}

async function handleDelete(
  id: string,
  env: Env,
  tenantId: string | undefined,
  auth: AuthContext,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const prompt = await getPromptService(env, id, tenantId ?? DEFAULT_TENANT_ID);
  if (!prompt) {
    return jsonResponse({ error: "Prompt not found" }, 404);
  }

  ensureTenantAccess(auth, prompt.tenantId);
  requirePermission(auth, "prompt:write", prompt.tenantId);

  await deletePromptService(env, prompt, logger, ctx);
  return jsonResponse({ success: true });
}

async function handleTenantList(env: Env, auth: AuthContext): Promise<Response> {
  const results = await env.DB.prepare(
    "SELECT id, name, slug, created_at FROM tenants ORDER BY name ASC"
  ).all<{ id: string; name: string; slug: string; created_at: string }>();

  let tenants: Tenant[] = (results.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at
  }));

  if (!hasPermission(auth, "prompt:read")) {
    const allowedTenants = new Set<string>();
    for (const [tenantId] of auth.tenantPermissions) {
      allowedTenants.add(tenantId);
    }
    tenants = tenants.filter((tenant) => allowedTenants.has(tenant.id));
  }

  return jsonResponse({ data: tenants });
}

async function handleTenantCreate(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const payload = await readJson(request);
  const parsed = createTenantSchema.parse(payload);
  const normalizedName = parsed.name.trim();
  const normalizedSlug = parsed.slug.toLowerCase();

  const existing = await env.DB.prepare("SELECT id FROM tenants WHERE slug = ? OR name = ?")
    .bind(normalizedSlug, normalizedName)
    .first<{ id: string }>();

  if (existing) {
    return jsonResponse({ error: "Tenant already exists" }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO tenants (id, name, slug, created_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(id, normalizedName, normalizedSlug, now)
    .run();

  const tenant: Tenant = {
    id,
    name: normalizedName,
    slug: normalizedSlug,
    createdAt: now
  };

  if (!auth.globalPermissions.has("*")) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO user_roles (user_id, role_id, tenant_id, created_at)
       VALUES (?, ?, ?, ?)`
    )
      .bind(auth.user.id, "role-admin", tenant.id, now)
      .run();
  }

  return jsonResponse({ data: tenant }, 201);
}

async function handleListVersions(
  id: string,
  env: Env,
  tenantId: string,
  url: URL
): Promise<Response> {
  const tenant = await ensureTenant(env, tenantId);
  const limit = Math.min(
    Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10)),
    100
  );

  try {
    const { prompt, versions } = await listPromptVersionsService(env, id, tenant.id, limit);
    return jsonResponse({ data: versions, prompt });
  } catch (error) {
    if (error instanceof Error && error.message === "Prompt not found") {
      return jsonResponse({ error: "Prompt not found" }, 404);
    }
    throw error;
  }
}

async function handleRecordUsage(
  id: string,
  request: Request,
  env: Env,
  tenantId: string
): Promise<Response> {
  const tenant = await ensureTenant(env, tenantId);
  const prompt = await getPromptService(env, id, tenant.id);
  if (!prompt) {
    return jsonResponse({ error: "Prompt not found" }, 404);
  }

  const body = await readJson(request);
  const parsed = usageEventSchema.parse(body ?? {});
  const recordedAt = await recordPromptUsageService(env, prompt, parsed.metadata);
  return jsonResponse({ success: true, recordedAt });
}

async function handlePromptAnalytics(env: Env, tenantId: string, url: URL): Promise<Response> {
  const tenant = await ensureTenant(env, tenantId);
  const rangeDays = Math.min(
    Math.max(1, Number.parseInt(url.searchParams.get("range") || "7", 10)),
    90
  );
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

  const analytics = await env.DB.prepare(
    `SELECT
        p.id AS prompt_id,
        p.title,
        p.version,
        COALESCE(COUNT(e.id), 0) AS usage_count,
        MAX(e.occurred_at) AS last_used
      FROM prompts p
      LEFT JOIN prompt_usage_events e
        ON e.prompt_id = p.id
        AND e.tenant_id = p.tenant_id
        AND e.occurred_at >= ?
      WHERE p.tenant_id = ?
      GROUP BY p.id, p.title, p.version
      ORDER BY usage_count DESC, p.updated_at DESC
      LIMIT 100`
  )
    .bind(since, tenant.id)
    .all<{
      prompt_id: string;
      title: string;
      version: number;
      usage_count: number;
      last_used: string | null;
    }>();

  const data: PromptAnalyticsEntry[] = (analytics.results || []).map((row) => ({
    promptId: row.prompt_id,
    title: row.title,
    version: row.version,
    usageCount: row.usage_count,
    lastUsed: row.last_used
  }));

  return jsonResponse({
    data,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    },
    rangeDays
  });
}

async function handleAnalyticsOverview(env: Env, tenantId: string, url: URL): Promise<Response> {
  const tenant = await ensureTenant(env, tenantId);
  const rangeDays = Math.min(
    Math.max(7, Number.parseInt(url.searchParams.get("range") || "14", 10)),
    90
  );

  const now = new Date();
  const today = startOfUtcDay(now);
  const yesterday = addUtcDays(today, -1);
  const weekStart = addUtcDays(today, -6);
  const prevWeekStart = addUtcDays(weekStart, -7);
  const trendStart = addUtcDays(today, -(rangeDays - 1));
  const activeStart = addUtcDays(today, -29);
  const prevActiveStart = addUtcDays(activeStart, -30);

  const [
    totalPromptsRow,
    newPromptsThisWeekRow,
    usageTodayRow,
    usageYesterdayRow,
    usageThisWeekRow,
    usagePrevWeekRow,
    activePromptsRow,
    activePromptsPrevRow,
    recentlyUpdatedRow,
    recentlyUpdatedPrevRow
  ] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as count FROM prompts WHERE tenant_id = ? AND archived = 0`)
      .bind(tenant.id)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompts
        WHERE tenant_id = ?
          AND archived = 0
          AND created_at >= ?`
    )
      .bind(tenant.id, isoString(weekStart))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompt_usage_events
        WHERE tenant_id = ?
          AND occurred_at >= ?`
    )
      .bind(tenant.id, isoString(today))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompt_usage_events
        WHERE tenant_id = ?
          AND occurred_at >= ?
          AND occurred_at < ?`
    )
      .bind(tenant.id, isoString(yesterday), isoString(today))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompt_usage_events
        WHERE tenant_id = ?
          AND occurred_at >= ?`
    )
      .bind(tenant.id, isoString(weekStart))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompt_usage_events
        WHERE tenant_id = ?
          AND occurred_at >= ?
          AND occurred_at < ?`
    )
      .bind(tenant.id, isoString(prevWeekStart), isoString(weekStart))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(DISTINCT prompt_id) as count
         FROM prompt_usage_events
        WHERE tenant_id = ?
          AND occurred_at >= ?`
    )
      .bind(tenant.id, isoString(activeStart))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(DISTINCT prompt_id) as count
         FROM prompt_usage_events
        WHERE tenant_id = ?
          AND occurred_at >= ?
          AND occurred_at < ?`
    )
      .bind(tenant.id, isoString(prevActiveStart), isoString(activeStart))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompts
        WHERE tenant_id = ?
          AND archived = 0
          AND updated_at >= ?`
    )
      .bind(tenant.id, isoString(weekStart))
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count
         FROM prompts
        WHERE tenant_id = ?
          AND archived = 0
          AND updated_at >= ?
          AND updated_at < ?`
    )
      .bind(tenant.id, isoString(prevWeekStart), isoString(weekStart))
      .first<{ count: number }>()
  ]);

  const totalPrompts = Number(totalPromptsRow?.count ?? 0);
  const newPromptsThisWeek = Number(newPromptsThisWeekRow?.count ?? 0);
  const usageToday = Number(usageTodayRow?.count ?? 0);
  const usageYesterday = Number(usageYesterdayRow?.count ?? 0);
  const usageThisWeek = Number(usageThisWeekRow?.count ?? 0);
  const usagePrevWeek = Number(usagePrevWeekRow?.count ?? 0);
  const activePrompts = Number(activePromptsRow?.count ?? 0);
  const activePromptsPrev = Number(activePromptsPrevRow?.count ?? 0);
  const recentlyUpdated = Number(recentlyUpdatedRow?.count ?? 0);
  const recentlyUpdatedPrev = Number(recentlyUpdatedPrevRow?.count ?? 0);

  const trendQuery = await env.DB.prepare(
    `SELECT DATE(occurred_at) AS day, COUNT(*) AS count
       FROM prompt_usage_events
      WHERE tenant_id = ?
        AND occurred_at >= ?
      GROUP BY day
      ORDER BY day ASC`
  )
    .bind(tenant.id, isoString(trendStart))
    .all<{ day: string; count: number }>();

  const trendMap = new Map<string, number>();
  for (const row of trendQuery.results ?? []) {
    const day = row.day;
    const count = Number(row.count ?? 0);
    trendMap.set(day, count);
  }

  const trend: UsageTrendPoint[] = [];
  for (let cursor = startOfUtcDay(trendStart); cursor <= today; cursor = addUtcDays(cursor, 1)) {
    const key = isoDateStamp(cursor);
    trend.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  const topPromptsQuery = await env.DB.prepare(
    `SELECT p.id,
            p.title,
            p.version,
            COALESCE(COUNT(e.id), 0) AS usage_count,
            MAX(e.occurred_at) AS last_used
       FROM prompts p
       LEFT JOIN prompt_usage_events e
         ON e.prompt_id = p.id
        AND e.tenant_id = p.tenant_id
        AND e.occurred_at >= ?
      WHERE p.tenant_id = ?
        AND p.archived = 0
      GROUP BY p.id, p.title, p.version
      ORDER BY usage_count DESC, p.updated_at DESC
      LIMIT 5`
  )
    .bind(isoString(weekStart), tenant.id)
    .all<{
      id: string;
      title: string;
      version: number;
      usage_count: number;
      last_used: string | null;
    }>();

  const topPrompts: TopPromptSummary[] = (topPromptsQuery.results || []).map((row) => ({
    promptId: row.id,
    title: row.title,
    version: row.version,
    usageCount: Number(row.usage_count ?? 0),
    lastUsed: row.last_used ?? null
  }));

  const stats: DashboardStats = {
    totalPrompts: {
      value: totalPrompts,
      previous: Math.max(totalPrompts - newPromptsThisWeek, 0)
    },
    usageToday: {
      value: usageToday,
      previous: usageYesterday
    },
    usageThisWeek: {
      value: usageThisWeek,
      previous: usagePrevWeek
    },
    activePrompts: {
      value: activePrompts,
      previous: activePromptsPrev
    },
    recentlyUpdated: {
      value: recentlyUpdated,
      previous: recentlyUpdatedPrev
    }
  };

  const overview: DashboardOverviewResponse = {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    },
    rangeDays,
    stats,
    trend,
    topPrompts
  };

  return jsonResponse({ data: overview });
}

async function handlePromptSuggestions(url: URL, env: Env, tenantId: string): Promise<Response> {
  const normalized = (url.searchParams.get("q") || "").trim();
  if (!normalized) {
    return jsonResponse({ data: [] });
  }

  const limitParam = Number.parseInt(url.searchParams.get("limit") || "5", 10);
  const limit = Number.isNaN(limitParam) ? 5 : Math.min(Math.max(limitParam, 1), 20);

  const suggestions: PromptSuggestion[] = await fetchPromptSuggestions(
    env,
    tenantId,
    normalized,
    limit
  );
  return jsonResponse({ data: suggestions });
}

async function handleBulkCreatePromptsRequest(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await readJson(request);
  const actorId = auth.user.email ?? auth.user.id ?? null;
  const result = await bulkCreatePrompts(env.DB, tenantResolution.tenantId, payload, actorId);

  const successEntries = (result.results ?? []).filter((entry) => entry.success);
  const createdIds = successEntries.map((entry) => entry.id);
  const promptRecords = await Promise.all(
    createdIds.map((id) => fetchPrompt(id, env, tenantResolution.tenantId))
  );
  const prompts = promptRecords.filter(
    (prompt): prompt is NonNullable<(typeof promptRecords)[number]> => Boolean(prompt)
  );

  if (createdIds.length) {
    ctx.waitUntil(
      (async () => {
        if (prompts.length) {
          await Promise.all(
            prompts.map((prompt) =>
              recordPromptVersion(env, {
                promptId: prompt.id,
                tenantId: prompt.tenantId,
                version: prompt.version,
                title: prompt.title,
                body: prompt.body,
                tagsJson: JSON.stringify(prompt.tags ?? []),
                metadataJson: prompt.metadata ? JSON.stringify(prompt.metadata) : null,
                createdAt: prompt.createdAt,
                createdBy: prompt.createdBy ?? actorId
              })
            )
          );
        }
        await clearListCache(env, logger, tenantResolution.tenantId);
      })()
    );
  }

  return jsonResponse({ data: result, prompts });
}

async function handleBulkUpdatePromptsRequest(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await readJson(request);
  const actorId = auth.user.email ?? auth.user.id ?? null;
  const result = await bulkUpdatePrompts(env.DB, tenantResolution.tenantId, payload);

  const successEntries = (result.results ?? []).filter((entry) => entry.success);
  if (!successEntries.length) {
    return jsonResponse({ data: result, prompts: [] });
  }

  const updatedIds = successEntries.map((entry) => entry.id);
  await Promise.all(
    updatedIds.map((id) => invalidatePromptCaches(env, id, tenantResolution.tenantId, logger))
  );

  const promptRecords = await Promise.all(
    updatedIds.map((id) => fetchPrompt(id, env, tenantResolution.tenantId))
  );
  const prompts = promptRecords.filter(
    (prompt): prompt is NonNullable<(typeof promptRecords)[number]> => Boolean(prompt)
  );

  const versionSet = new Set(
    successEntries
      .map((entry) => entry.metadata as { versionIncremented?: boolean } | undefined)
      .map((metadata, index) =>
        metadata?.versionIncremented ? successEntries[index].id : undefined
      )
      .filter((value): value is string => Boolean(value))
  );

  ctx.waitUntil(
    (async () => {
      if (prompts.length && versionSet.size) {
        await Promise.all(
          prompts
            .filter((prompt) => versionSet.has(prompt.id))
            .map((prompt) =>
              recordPromptVersion(env, {
                promptId: prompt.id,
                tenantId: prompt.tenantId,
                version: prompt.version,
                title: prompt.title,
                body: prompt.body,
                tagsJson: JSON.stringify(prompt.tags ?? []),
                metadataJson: prompt.metadata ? JSON.stringify(prompt.metadata) : null,
                createdAt: prompt.updatedAt,
                createdBy: actorId
              })
            )
        );
      }
      await clearListCache(env, logger, tenantResolution.tenantId);
    })()
  );

  return jsonResponse({ data: result, prompts });
}

async function handleBulkDeletePromptsRequest(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await readJson(request);
  const result = await bulkDeletePrompts(env.DB, tenantResolution.tenantId, payload);
  const successEntries = (result.results ?? []).filter((entry) => entry.success);
  const deletedIds = successEntries.map((entry) => entry.id);

  if (deletedIds.length) {
    await Promise.all(
      deletedIds.map((id) => invalidatePromptCaches(env, id, tenantResolution.tenantId, logger))
    );
    ctx.waitUntil(clearListCache(env, logger, tenantResolution.tenantId));
  }

  return jsonResponse({ data: result });
}

async function handleBulkManageTagsRequest(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await readJson(request);
  const actorId = auth.user.email ?? auth.user.id ?? null;
  const result = await bulkManageTags(env.DB, tenantResolution.tenantId, payload);
  const successEntries = (result.results ?? []).filter((entry) => entry.success);
  if (!successEntries.length) {
    return jsonResponse({ data: result, prompts: [] });
  }

  const affectedIds = successEntries.map((entry) => entry.id);
  await Promise.all(
    affectedIds.map((id) => invalidatePromptCaches(env, id, tenantResolution.tenantId, logger))
  );

  const promptRecords = await Promise.all(
    affectedIds.map((id) => fetchPrompt(id, env, tenantResolution.tenantId))
  );
  const prompts = promptRecords.filter(
    (prompt): prompt is NonNullable<(typeof promptRecords)[number]> => Boolean(prompt)
  );

  ctx.waitUntil(
    (async () => {
      if (prompts.length) {
        await Promise.all(
          prompts.map((prompt) =>
            recordPromptVersion(env, {
              promptId: prompt.id,
              tenantId: prompt.tenantId,
              version: prompt.version,
              title: prompt.title,
              body: prompt.body,
              tagsJson: JSON.stringify(prompt.tags ?? []),
              metadataJson: prompt.metadata ? JSON.stringify(prompt.metadata) : null,
              createdAt: prompt.updatedAt,
              createdBy: actorId
            })
          )
        );
      }
      await clearListCache(env, logger, tenantResolution.tenantId);
    })()
  );

  return jsonResponse({ data: result, prompts });
}

async function handleBulkArchivePromptsRequest(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await readJson(request);
  const archiveSchema = z.object({
    ids: z.array(z.string().min(1)).min(1).max(100),
    archived: z.boolean().optional().default(true)
  });
  const parsed = archiveSchema.parse(payload);
  const result = await bulkArchivePrompts(
    env.DB,
    tenantResolution.tenantId,
    parsed.ids,
    parsed.archived
  );

  const successEntries = (result.results ?? []).filter((entry) => entry.success);
  if (!successEntries.length) {
    return jsonResponse({ data: result, prompts: [] });
  }

  const affectedIds = successEntries.map((entry) => entry.id);
  await Promise.all(
    affectedIds.map((id) => invalidatePromptCaches(env, id, tenantResolution.tenantId, logger))
  );

  const promptRecords = await Promise.all(
    affectedIds.map((id) => fetchPrompt(id, env, tenantResolution.tenantId))
  );
  const prompts = promptRecords.filter(
    (prompt): prompt is NonNullable<(typeof promptRecords)[number]> => Boolean(prompt)
  );

  ctx.waitUntil(clearListCache(env, logger, tenantResolution.tenantId));

  return jsonResponse({ data: result, prompts });
}

async function handlePromptsExport(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:read", tenantResolution.tenantId);

  const format = (url.searchParams.get("format") || "json").toLowerCase();
  const includeArchived = url.searchParams.get("includeArchived") === "true";
  const tags = url.searchParams.getAll("tag").filter(Boolean);

  if (format === "csv") {
    const csv = await exportPromptsCSV(env.DB, tenantResolution.tenantId, {
      includeArchived,
      tags: tags.length ? tags : undefined
    });
    const fileName = `prompts-${tenantResolution.tenantId}-${isoDateStamp(new Date())}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });
  }

  const data = await exportPromptsJSON(env.DB, tenantResolution.tenantId, {
    includeArchived,
    tags: tags.length ? tags : undefined
  });
  return jsonResponse({ data });
}

async function handlePromptsImportPreview(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await parseImportPayload(request);
  const result = await previewImport(env.DB, tenantResolution.tenantId, payload);
  return jsonResponse({ data: result });
}

async function handlePromptsImport(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: true
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:write", tenantResolution.tenantId);

  const payload = await parseImportPayload(request);
  const actorId = auth.user.email ?? auth.user.id ?? null;
  const result = await importPrompts(env.DB, tenantResolution.tenantId, payload, {
    actorId
  });

  const recordEntries = result.records ?? [];
  if (!recordEntries.length) {
    return jsonResponse({ data: result, prompts: [] });
  }

  const affectedIds = Array.from(new Set(recordEntries.map((record) => record.id)));
  await Promise.all(
    affectedIds.map((id) => invalidatePromptCaches(env, id, tenantResolution.tenantId, logger))
  );

  const promptRecords = await Promise.all(
    affectedIds.map((id) => fetchPrompt(id, env, tenantResolution.tenantId))
  );
  const prompts = promptRecords.filter(
    (prompt): prompt is NonNullable<(typeof promptRecords)[number]> => Boolean(prompt)
  );

  const createdSet = new Set(
    recordEntries.filter((record) => record.action === "created").map((record) => record.id)
  );

  ctx.waitUntil(
    (async () => {
      if (prompts.length) {
        const versionPromises = prompts.map((prompt) =>
          recordPromptVersion(env, {
            promptId: prompt.id,
            tenantId: prompt.tenantId,
            version: prompt.version,
            title: prompt.title,
            body: prompt.body,
            tagsJson: JSON.stringify(prompt.tags ?? []),
            metadataJson: prompt.metadata ? JSON.stringify(prompt.metadata) : null,
            createdAt: createdSet.has(prompt.id) ? prompt.createdAt : prompt.updatedAt,
            createdBy: actorId
          })
        );
        await Promise.all(versionPromises);
      }
      await clearListCache(env, logger, tenantResolution.tenantId);
    })()
  );

  return jsonResponse({ data: result, prompts });
}

async function parseImportPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return readJson(request);
  }

  if (contentType.includes("text/csv")) {
    const csv = await request.text();
    return parseCSVToJSON(csv);
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fileField = formData.get("file") ?? formData.get("upload");
    if (fileField && typeof fileField !== "string") {
      const fileLike = fileField as { text: () => Promise<string>; type?: string };
      if (typeof fileLike.text === "function") {
        const text = await fileLike.text();
        const type = typeof fileLike.type === "string" ? fileLike.type : "";
        return tryParseStructuredPayload(text, type);
      }
    }
    if (typeof fileField === "string") {
      return tryParseStructuredPayload(fileField, "");
    }
    const payloadField = formData.get("payload");
    if (typeof payloadField === "string") {
      return tryParseStructuredPayload(payloadField, "application/json");
    }
    throw jsonResponse({ error: "Import payload not provided" }, 400);
  }

  const raw = await request.text();
  return tryParseStructuredPayload(raw, contentType);
}

function tryParseStructuredPayload(text: string, contentType: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw jsonResponse({ error: "Import payload is empty" }, 400);
  }

  if (!contentType.includes("csv")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall back to CSV parsing
    }
  }

  return parseCSVToJSON(text);
}

async function handleTemplateRender(
  request: Request,
  env: Env,
  auth: AuthContext,
  url: URL
): Promise<Response> {
  const tenantResolution = await resolveTenantId(request, url, env, {
    allowDefault: true,
    requireTenant: false
  });
  ensureTenantAccess(auth, tenantResolution.tenantId);
  requirePermission(auth, "prompt:read", tenantResolution.tenantId);

  const payload = await readJson(request);
  const schema = z.object({
    template: z.string().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.unknown()).optional().default({}),
    options: z
      .object({
        strict: z.boolean().optional(),
        keepUnmatched: z.boolean().optional()
      })
      .optional()
  });
  const parsed = schema.parse(payload);

  let templateSource = parsed.template?.trim() ?? "";
  if (!templateSource && parsed.templateId) {
    const templateDef = getTemplateFromLibrary(parsed.templateId);
    if (!templateDef) {
      return jsonResponse({ error: "Template not found" }, 404);
    }
    templateSource = templateDef.template;
  }

  if (!templateSource) {
    return jsonResponse({ error: "Template content is required" }, 400);
  }

  const validated = validateRenderRequest({
    template: templateSource,
    variables: parsed.variables ?? {},
    options: parsed.options ?? {}
  });

  const rendered = renderTemplate(templateSource, validated.variables, validated.options ?? {});
  return jsonResponse({
    data: {
      rendered,
      variables: parseTemplate(templateSource).variables
    }
  });
}

async function handleTemplateValidate(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requirePermission(auth, "prompt:read");
  const payload = await readJson(request);
  const schema = z.object({
    template: z.string().min(1),
    sampleData: z.record(z.string(), z.unknown()).optional()
  });
  const parsed = schema.parse(payload);

  const validation = validateTemplate(parsed.template);
  let preview: string | null = null;
  if (parsed.sampleData) {
    try {
      preview = renderTemplate(parsed.template, parsed.sampleData, { keepUnmatched: true });
    } catch {
      preview = null;
    }
  }

  return jsonResponse({
    data: {
      valid: validation.valid,
      errors: validation.errors,
      variables: parseTemplate(parsed.template).variables,
      preview
    }
  });
}

async function handleTemplateVariables(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requirePermission(auth, "prompt:read");
  const payload = await readJson(request);
  const schema = z.object({
    template: z.string().optional(),
    templateId: z.string().optional()
  });
  const parsed = schema.parse(payload);

  let templateSource = parsed.template?.trim() ?? "";
  if (!templateSource && parsed.templateId) {
    const templateDef = getTemplateFromLibrary(parsed.templateId);
    if (!templateDef) {
      return jsonResponse({ error: "Template not found" }, 404);
    }
    templateSource = templateDef.template;
  }

  if (!templateSource) {
    return jsonResponse({
      data: {
        variables: [],
        count: 0
      }
    });
  }

  const parsedTemplate = parseTemplate(templateSource);
  return jsonResponse({
    data: {
      variables: parsedTemplate.variables,
      count: parsedTemplate.variables.length
    }
  });
}

async function handleTemplateLibraryList(auth: AuthContext, url: URL): Promise<Response> {
  requirePermission(auth, "prompt:read");
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("q")?.trim();

  let templates = TEMPLATE_LIBRARY;
  if (category) {
    templates = getTemplatesByCategory(category);
  }
  if (query) {
    templates = searchTemplateLibrary(query);
  }

  return jsonResponse({ data: templates });
}

async function handleTemplateLibraryByCategory(auth: AuthContext, path: string): Promise<Response> {
  requirePermission(auth, "prompt:read");
  const category = decodeURIComponent(path.replace("/templates/library/category/", ""));
  const templates = getTemplatesByCategory(category);
  return jsonResponse({ data: templates, category });
}

async function handleTemplateLibrarySearch(auth: AuthContext, url: URL): Promise<Response> {
  requirePermission(auth, "prompt:read");
  const query = (url.searchParams.get("q") || "").trim();
  if (!query) {
    return jsonResponse({ data: [] });
  }
  const results = searchTemplateLibrary(query);
  return jsonResponse({ data: results, query });
}

async function handleTemplateLibraryRetrieve(auth: AuthContext, path: string): Promise<Response> {
  requirePermission(auth, "prompt:read");
  const id = decodeURIComponent(path.replace("/templates/library/", ""));
  const template = getTemplateFromLibrary(id);
  if (!template) {
    return jsonResponse({ error: "Template not found" }, 404);
  }
  return jsonResponse({ data: template });
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request);
  const parsed = loginSchema.parse(payload);

  const record = await fetchUserByEmailWithPassword(env, parsed.email);
  if (!record) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const valid = await verifyPassword(parsed.password, record.passwordHash);
  if (!valid) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const tokens = await generateSessionTokens(env, record.user.id);
  const assignments = await fetchRoleAssignments(env, record.user.id);
  const context = buildAuthContext(record.user, assignments, "jwt");

  const accessMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.accessTokenExpiresAt).getTime() - Date.now()) / 1000)
  );
  const refreshMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.refreshTokenExpiresAt).getTime() - Date.now()) / 1000)
  );

  const accessCookie = `pm_access=${encodeURIComponent(tokens.accessToken)}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${accessMaxAge}`;
  const refreshCookie = `pm_refresh=${encodeURIComponent(tokens.refreshToken)}; HttpOnly; Path=/auth; SameSite=Lax; Secure; Max-Age=${refreshMaxAge}`;

  // CSRF token (double-submit cookie) - readable by JS
  const csrfToken = crypto.randomUUID();
  const csrfCookie = `pm_csrf=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax; Secure; Max-Age=${accessMaxAge}`;

  return jsonResponse(
    {
      data: {
        user: context.user,
        roles: context.roles,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt
      }
    },
    200,
    { "Set-Cookie": [accessCookie, refreshCookie, csrfCookie] }
  );
}

async function handleRefresh(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request);
  const parsed = refreshSchema.parse(payload);

  const refreshRecord = await authenticateRefreshToken(env, parsed.refreshToken);
  if (!refreshRecord) {
    return jsonResponse({ error: "Invalid refresh token" }, 401);
  }

  await invalidateRefreshToken(env, parsed.refreshToken);

  const user = await fetchUser(env, refreshRecord.user_id);
  if (!user) {
    return jsonResponse({ error: "Invalid refresh token" }, 401);
  }

  const tokens = await generateSessionTokens(env, user.id);
  const assignments = await fetchRoleAssignments(env, user.id);
  const context = buildAuthContext(user, assignments, "jwt");

  const accessMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.accessTokenExpiresAt).getTime() - Date.now()) / 1000)
  );
  const refreshMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.refreshTokenExpiresAt).getTime() - Date.now()) / 1000)
  );

  const accessCookie = `pm_access=${encodeURIComponent(tokens.accessToken)}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${accessMaxAge}`;
  const refreshCookie = `pm_refresh=${encodeURIComponent(tokens.refreshToken)}; HttpOnly; Path=/auth; SameSite=Lax; Secure; Max-Age=${refreshMaxAge}`;
  const csrfToken = crypto.randomUUID();
  const csrfCookie = `pm_csrf=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax; Secure; Max-Age=${accessMaxAge}`;

  return jsonResponse(
    {
      data: {
        user: context.user,
        roles: context.roles,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt
      }
    },
    200,
    { "Set-Cookie": [accessCookie, refreshCookie, csrfCookie] }
  );
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request);
  const parsed = refreshSchema.parse(payload);
  await invalidateRefreshToken(env, parsed.refreshToken);
  // Clear cookies
  const clearAccess = `pm_access=; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=0`;
  const clearRefresh = `pm_refresh=; HttpOnly; Path=/auth; SameSite=Lax; Secure; Max-Age=0`;
  const clearCsrf = `pm_csrf=; Path=/; SameSite=Lax; Secure; Max-Age=0`;
  return jsonResponse({ success: true }, 200, {
    "Set-Cookie": [clearAccess, clearRefresh, clearCsrf]
  });
}

async function handleApiKeyList(env: Env, auth: AuthContext): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT ak.id, ak.name, ak.created_at, ak.last_used_at, ak.revoked, ak.tenant_id, r.name as role_name
     FROM api_keys ak
     JOIN roles r ON ak.role_id = r.id
     WHERE ak.user_id = ?
     ORDER BY ak.created_at DESC`
  )
    .bind(auth.user.id)
    .all<{
      id: string;
      name: string;
      created_at: string;
      last_used_at: string | null;
      revoked: number;
      tenant_id: string | null;
      role_name: string;
    }>();

  const data = (rows.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revoked: row.revoked === 1,
    tenantId: row.tenant_id,
    roleName: row.role_name
  }));

  return jsonResponse({ data });
}

async function handleApiKeyCreate(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const payload = await readJson(request);
  const parsed = apiKeyCreateSchema.parse(payload);

  let tenantId: string | null = null;
  if (parsed.tenantId) {
    const tenant = await ensureTenant(env, parsed.tenantId);
    tenantId = tenant.id;
    ensureTenantAccess(auth, tenant.id);
  }

  const role = await env.DB.prepare("SELECT id FROM roles WHERE id = ?")
    .bind(parsed.roleId)
    .first<{ id: string }>();

  if (!role) {
    return jsonResponse({ error: "Role not found" }, 404);
  }

  const created = await createApiKey(env, auth.user.id, role.id, tenantId, parsed.name.trim());

  return jsonResponse(
    {
      data: {
        id: created.id,
        key: created.key,
        tenantId,
        roleId: role.id,
        name: parsed.name.trim()
      }
    },
    201
  );
}

async function handleApiKeyRotate(
  env: Env,
  auth: AuthContext,
  apiKeyId: string
): Promise<Response> {
  const record = await env.DB.prepare(`SELECT id, user_id, revoked FROM api_keys WHERE id = ?`)
    .bind(apiKeyId)
    .first<{ id: string; user_id: string; revoked: number }>();

  if (!record || record.user_id !== auth.user.id) {
    return jsonResponse({ error: "API key not found" }, 404);
  }

  const key = await rotateApiKey(env, apiKeyId);

  return jsonResponse({
    data: {
      id: apiKeyId,
      key
    }
  });
}

async function handleApiKeyRevoke(
  env: Env,
  auth: AuthContext,
  apiKeyId: string
): Promise<Response> {
  const record = await env.DB.prepare(`SELECT id, user_id, revoked FROM api_keys WHERE id = ?`)
    .bind(apiKeyId)
    .first<{ id: string; user_id: string; revoked: number }>();

  if (!record || record.user_id !== auth.user.id) {
    return jsonResponse({ error: "API key not found" }, 404);
  }

  if (record.revoked === 1) {
    return jsonResponse({
      data: {
        id: apiKeyId,
        revoked: true
      }
    });
  }

  await revokeApiKey(env, apiKeyId);

  return jsonResponse({
    data: {
      id: apiKeyId,
      revoked: true
    }
  });
}

async function warmCacheIfNeeded(env: Env, logger: Logger): Promise<void> {
  try {
    const existing = await env.PROMPT_CACHE.get(CACHE_WARM_KEY);
    const lastWarm = existing ? Number(existing) : 0;
    const now = Date.now();
    if (Number.isFinite(lastWarm) && now - lastWarm < CACHE_WARM_INTERVAL_MS) {
      return;
    }

    await env.PROMPT_CACHE.put(CACHE_WARM_KEY, String(now), { expirationTtl: 24 * 60 * 60 });
    await warmTopPrompts(env, logger);
  } catch (error) {
    logger.debug("cache.warm.skip", { error: serializeError(error) });
  }
}

async function warmTopPrompts(env: Env, logger: Logger): Promise<void> {
  const tenantRows = await env.DB.prepare("SELECT id FROM tenants").all<{ id: string }>();
  const tenantIds = tenantRows.results?.map((row) => row.id) ?? [];

  const warmCtx: ExecutionContext = {
    waitUntil(promise) {
      void promise.catch((error) =>
        logger.debug("cache.warm.deferred_error", { error: serializeError(error) })
      );
    },
    passThroughOnException() {
      // no-op
    },
    props: {}
  };

  for (const tenantId of tenantIds) {
    const promptRows = await env.DB.prepare(
      `SELECT id FROM prompts
         WHERE tenant_id = ? AND archived = 0
         ORDER BY updated_at DESC
         LIMIT 5`
    )
      .bind(tenantId)
      .all<{ id: string }>();

    for (const prompt of promptRows.results ?? []) {
      await env.PROMPT_CACHE.delete(buildPromptCacheKey(prompt.id));
      await fetchPrompt(prompt.id, env, tenantId);
    }

    await listPromptsService(
      env,
      {
        tenantId,
        search: undefined,
        tag: undefined,
        metadataKey: undefined,
        metadataValue: undefined,
        sortField: "updated_at",
        sortOrder: "DESC",
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        offset: 0
      },
      logger,
      warmCtx
    );
  }

  if (tenantIds.length) {
    logger.info("cache.warm.success", { tenants: tenantIds.length });
  }
}

async function handleBearerTokenCreate(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  // Allow both API key management permission and general prompt write permission
  // This enables users with prompt management access to generate bearer tokens for API usage
  if (!hasPermission(auth, "api-key:manage") && !hasPermission(auth, "prompt:write")) {
    throw jsonResponse({ error: "Forbidden" }, 403);
  }

  const payload = await readJson(request);
  const parsed = bearerTokenSchema.parse(payload);

  // Use the parsed expiresIn value for the token generation
  const { token, expiresAt } = await generateBearerToken(env, auth.user.id, parsed.expiresIn);

  return jsonResponse(
    {
      data: {
        token,
        expiresAt,
        tokenType: "bearer",
        name: parsed.name ?? "API Bearer Token"
      }
    },
    201
  );
}

addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection", event.reason);
});
