import type { Page, Route } from "@playwright/test";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface Prompt {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  archived: boolean;
  createdBy: string | null;
}

type SortField = "created_at" | "updated_at" | "title";
type SortOrder = "asc" | "desc";

interface PromptListResponse {
  data: Prompt[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  sort: SortField;
  order: SortOrder;
  filters: {
    search?: string;
    tag?: string;
    metadataKey?: string;
    metadataValue?: string;
  };
}

interface PromptVersion {
  version: number;
  title: string;
  body: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
}

interface PromptComment {
  id: string;
  promptId: string;
  tenantId: string;
  parentId: string | null;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
}

type ShareTargetType = "user" | "email" | "tenant";
type ShareRole = "viewer" | "editor" | "approver";

interface PromptShare {
  id: string;
  promptId: string;
  tenantId: string;
  targetType: ShareTargetType;
  targetIdentifier: string;
  role: ShareRole;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

interface PromptApproval {
  id: string;
  promptId: string;
  tenantId: string;
  requestedBy: string;
  approver: string;
  status: ApprovalStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromptActivityEntry {
  id: string;
  promptId: string;
  tenantId: string;
  actor: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface DashboardMetric {
  value: number;
  previous?: number;
}

interface DashboardOverviewResponse {
  tenant: Pick<Tenant, "id" | "name" | "slug">;
  rangeDays: number;
  stats: {
    totalPrompts: DashboardMetric;
    usageToday: DashboardMetric;
    usageThisWeek: DashboardMetric;
    activePrompts: DashboardMetric;
    recentlyUpdated: DashboardMetric;
  };
  trend: Array<{ date: string; count: number }>;
  topPrompts: Array<{
    promptId: string;
    title: string;
    version: number;
    usageCount: number;
    lastUsed: string | null;
  }>;
}

interface PromptAnalyticsEntry {
  promptId: string;
  title: string;
  version: number;
  usageCount: number;
  lastUsed: string | null;
}

interface PromptAnalyticsResponse {
  data: PromptAnalyticsEntry[];
  tenant: Pick<Tenant, "id" | "name" | "slug">;
  rangeDays: number;
}

interface NotificationItem {
  id: string;
  tenantId: string | null;
  recipient: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface ApiState {
  tenants: Tenant[];
  promptsByTenant: Record<string, Prompt[]>;
  promptVersions: Record<string, PromptVersion[]>;
  promptComments: Record<string, PromptComment[]>;
  promptShares: Record<string, PromptShare[]>;
  promptApprovals: Record<string, PromptApproval[]>;
  promptActivity: Record<string, PromptActivityEntry[]>;
  dashboardOverview: Record<string, DashboardOverviewResponse>;
  analytics: Record<string, Record<number, PromptAnalyticsResponse>>;
  notifications: NotificationItem[];
  failures: {
    tenants?: number;
    prompts?: Record<string, number>;
    dashboard?: Record<string, number>;
    analytics?: Record<string, Record<number, number>>;
    notifications?: number;
  };
}

export function createDefaultApiState(): ApiState {
  const baseDate = new Date("2024-03-01T12:00:00.000Z");
  let __nextIdCounter = 1;
  const __nextId = (prefix: string) => `${prefix}_${__nextIdCounter++}`;

  const tenants: Tenant[] = [
    {
      id: "tenant_acme",
      name: "Acme Corp",
      slug: "acme",
      createdAt: new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString()
    },
    {
      id: "tenant_globex",
      name: "Globex",
      slug: "globex",
      createdAt: new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString()
    }
  ];

  const promptsByTenant: Record<string, Prompt[]> = {
    tenant_acme: Array.from({ length: 8 }).map((_, index) => {
      const createdAt = new Date(baseDate.getTime() - index * 1000 * 60 * 60 * 12);
      return {
        id: `prompt_acme_${index + 1}`,
        tenantId: "tenant_acme",
        title: `Acme Prompt ${index + 1}`,
        body: `You are assisting Acme users with workflow ${index + 1}.`,
        tags: index % 2 === 0 ? ["support", "beta"] : ["onboarding"],
        metadata: index % 2 === 0 ? { channel: "chat", tier: "enterprise" } : null,
        createdAt: createdAt.toISOString(),
        updatedAt: new Date(createdAt.getTime() + 1000 * 60 * 20).toISOString(),
        version: index % 3 === 0 ? 3 : 2,
        archived: index === 7,
        createdBy: index % 2 === 0 ? "morgan" : "casey"
      } as Prompt;
    }),
    tenant_globex: Array.from({ length: 5 }).map((_, index) => {
      const createdAt = new Date(baseDate.getTime() - index * 1000 * 60 * 60 * 6);
      return {
        id: `prompt_globex_${index + 1}`,
        tenantId: "tenant_globex",
        title: `Globex Prompt ${index + 1}`,
        body: `Handle Globex automation ${index + 1}.`,
        tags: index % 2 === 0 ? ["growth"] : ["sales"],
        metadata: index === 0 ? { category: "priority" } : null,
        createdAt: createdAt.toISOString(),
        updatedAt: new Date(createdAt.getTime() + 1000 * 60 * 45).toISOString(),
        version: 1,
        archived: false,
        createdBy: "jordan"
      } as Prompt;
    })
  };

  const promptVersions: Record<string, PromptVersion[]> = {};
  Object.values(promptsByTenant).forEach((prompts) => {
    prompts.forEach((prompt) => {
      promptVersions[prompt.id] = [
        {
          version: prompt.version,
          title: prompt.title,
          body: prompt.body,
          tags: prompt.tags,
          metadata: prompt.metadata,
          createdAt: prompt.updatedAt,
          createdBy: prompt.createdBy
        },
        {
          version: prompt.version - 1,
          title: `${prompt.title} draft`,
          body: `${prompt.body}\nPrevious revision.`,
          tags: prompt.tags,
          metadata: prompt.metadata,
          createdAt: new Date(
            new Date(prompt.updatedAt).getTime() - 1000 * 60 * 60 * 24
          ).toISOString(),
          createdBy: "revision-bot"
        }
      ].filter((version) => version.version > 0);
    });
  });

  const promptComments: Record<string, PromptComment[]> = {
    prompt_acme_1: [
      {
        id: "comment_1",
        promptId: "prompt_acme_1",
        tenantId: "tenant_acme",
        parentId: null,
        body: "This prompt looks great!",
        createdBy: "alex",
        createdAt: new Date(baseDate.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date(baseDate.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        resolved: false
      },
      {
        id: "comment_2",
        promptId: "prompt_acme_1",
        tenantId: "tenant_acme",
        parentId: "comment_1",
        body: "Thanks! I'll adjust the flow accordingly.",
        createdBy: "morgan",
        createdAt: new Date(baseDate.getTime() - 1000 * 60 * 60).toISOString(),
        updatedAt: new Date(baseDate.getTime() - 1000 * 60 * 60).toISOString(),
        resolved: false
      }
    ]
  };

  const promptShares: Record<string, PromptShare[]> = {
    prompt_acme_1: [
      {
        id: "share_1",
        promptId: "prompt_acme_1",
        tenantId: "tenant_acme",
        targetType: "user",
        targetIdentifier: "alex",
        role: "editor",
        createdBy: "morgan",
        createdAt: new Date(baseDate.getTime() - 1000 * 60 * 15).toISOString(),
        expiresAt: null
      }
    ]
  };

  const promptApprovals: Record<string, PromptApproval[]> = {
    prompt_acme_1: [
      {
        id: "approval_1",
        promptId: "prompt_acme_1",
        tenantId: "tenant_acme",
        requestedBy: "morgan",
        approver: "alex",
        status: "pending",
        message: "Requesting final sign-off",
        createdAt: new Date(baseDate.getTime() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(baseDate.getTime() - 1000 * 60 * 30).toISOString()
      }
    ]
  };

  const promptActivity: Record<string, PromptActivityEntry[]> = {
    prompt_acme_1: [
      {
        id: "activity_1",
        promptId: "prompt_acme_1",
        tenantId: "tenant_acme",
        actor: "alex",
        action: "commented",
        metadata: { body: "This prompt looks great!" },
        createdAt: new Date(baseDate.getTime() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: "activity_2",
        promptId: "prompt_acme_1",
        tenantId: "tenant_acme",
        actor: "system",
        action: "usage_recorded",
        metadata: { count: 5 },
        createdAt: new Date(baseDate.getTime() - 1000 * 60 * 45).toISOString()
      }
    ]
  };

  const dashboardOverview: Record<string, DashboardOverviewResponse> = tenants.reduce(
    (acc, tenant) => {
      acc[tenant.id] = {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        rangeDays: 14,
        stats: {
          totalPrompts: { value: promptsByTenant[tenant.id]?.length ?? 0, previous: 6 },
          usageToday: { value: tenant.id === "tenant_acme" ? 42 : 17, previous: 12 },
          usageThisWeek: { value: tenant.id === "tenant_acme" ? 280 : 96, previous: 210 },
          activePrompts: { value: tenant.id === "tenant_acme" ? 7 : 5, previous: 5 },
          recentlyUpdated: { value: 3, previous: 2 }
        },
        trend: Array.from({ length: 7 }).map((_, index) => ({
          date: new Date(baseDate.getTime() - index * 1000 * 60 * 60 * 24).toISOString(),
          count: tenant.id === "tenant_acme" ? 25 + index * 3 : 12 + index * 2
        })),
        topPrompts: (promptsByTenant[tenant.id] || []).slice(0, 5).map((prompt, index) => ({
          promptId: prompt.id,
          title: prompt.title,
          version: prompt.version,
          usageCount: 100 - index * 10,
          lastUsed: new Date(baseDate.getTime() - index * 1000 * 60 * 60).toISOString()
        }))
      };
      return acc;
    },
    {} as Record<string, DashboardOverviewResponse>
  );

  const analytics: Record<string, Record<number, PromptAnalyticsResponse>> = {};
  tenants.forEach((tenant) => {
    const dataset = (promptsByTenant[tenant.id] || []).map((prompt, index) => ({
      promptId: prompt.id,
      title: prompt.title,
      version: prompt.version,
      usageCount: 80 - index * 5,
      lastUsed: new Date(baseDate.getTime() - index * 1000 * 60 * 90).toISOString()
    }));
    analytics[tenant.id] = {
      7: { data: dataset.slice(0, 3), tenant: tenant, rangeDays: 7 },
      14: { data: dataset.slice(0, 5), tenant: tenant, rangeDays: 14 },
      30: { data: dataset, tenant: tenant, rangeDays: 30 }
    };
  });

  const notifications: NotificationItem[] = [
    {
      id: "notification_1",
      tenantId: "tenant_acme",
      recipient: "operator",
      type: "usage",
      message: "Prompt Acme Prompt 1 exceeded target usage.",
      metadata: { promptId: "prompt_acme_1" },
      readAt: null,
      createdAt: new Date(baseDate.getTime() - 1000 * 60 * 20).toISOString()
    },
    {
      id: "notification_2",
      tenantId: "tenant_acme",
      recipient: "operator",
      type: "approval",
      message: "Approval requested for Globex Prompt 2.",
      metadata: { promptId: "prompt_globex_2" },
      readAt: new Date(baseDate.getTime() - 1000 * 60 * 60).toISOString(),
      createdAt: new Date(baseDate.getTime() - 1000 * 60 * 60).toISOString()
    }
  ];

  return {
    tenants,
    promptsByTenant,
    promptVersions,
    promptComments,
    promptShares,
    promptApprovals,
    promptActivity,
    dashboardOverview,
    analytics,
    notifications,
    failures: {}
  };
}

export async function setupApiMocks(page: Page, overrides?: Partial<ApiState>): Promise<ApiState> {
  const base = createDefaultApiState();
  const state: ApiState = {
    ...base,
    ...overrides,
    promptsByTenant: { ...base.promptsByTenant, ...(overrides?.promptsByTenant ?? {}) },
    promptVersions: { ...base.promptVersions, ...(overrides?.promptVersions ?? {}) },
    promptComments: { ...base.promptComments, ...(overrides?.promptComments ?? {}) },
    promptShares: { ...base.promptShares, ...(overrides?.promptShares ?? {}) },
    promptApprovals: { ...base.promptApprovals, ...(overrides?.promptApprovals ?? {}) },
    promptActivity: { ...base.promptActivity, ...(overrides?.promptActivity ?? {}) },
    dashboardOverview: { ...base.dashboardOverview, ...(overrides?.dashboardOverview ?? {}) },
    analytics: { ...base.analytics, ...(overrides?.analytics ?? {}) },
    failures: { ...base.failures, ...(overrides?.failures ?? {}) }
  };

  const idCounters: Record<string, number> = {};
  const __nextId = (prefix: string) => {
    idCounters[prefix] = (idCounters[prefix] ?? 0) + 1;
    return `${prefix}_${Date.now()}_${idCounters[prefix]}`;
  };

  const fulfillJson = async (route: Route, status: number, body: unknown) => {
    await route.fulfill({
      status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  };

  const maybeFail = async (
    route: Route,
    key: keyof ApiState["failures"],
    tenantId?: string,
    extraKey?: string
  ): Promise<boolean> => {
    const failureBucket = state.failures[key];
    if (!failureBucket) return false;

    if (typeof failureBucket === "number") {
      if (failureBucket <= 0) return false;
      state.failures[key] = (failureBucket - 1) as never;
      await route.fulfill({ status: 500, body: "Internal Server Error" });
      return true;
    }

    if (tenantId && typeof failureBucket === "object") {
      const tenantFailures = (failureBucket as Record<string, unknown>)[tenantId];
      if (!tenantFailures) return false;

      if (typeof tenantFailures === "number") {
        if (tenantFailures <= 0) return false;
        (failureBucket as Record<string, number>)[tenantId] = tenantFailures - 1;
        await route.fulfill({ status: 500, body: "Internal Server Error" });
        return true;
      }

      if (extraKey && typeof tenantFailures === "object") {
        const inner = (tenantFailures as Record<string, number>)[extraKey];
        if (!inner) return false;
        if (inner <= 0) return false;
        (tenantFailures as Record<string, number>)[extraKey] = inner - 1;
        await route.fulfill({ status: 500, body: "Internal Server Error" });
        return true;
      }
    }

    return false;
  };

  await page.route("**/tenants", async (route, request) => {
    const method = request.method();

    if (await maybeFail(route, "tenants")) return;

    if (method === "GET") {
      await fulfillJson(route, 200, { data: state.tenants });
      return;
    }

    if (method === "POST") {
      const payload = JSON.parse(request.postData() || "{}");
      const now = new Date().toISOString();
      const tenant: Tenant = {
        id: __nextId("tenant"),
        name: payload.name,
        slug: payload.slug,
        createdAt: now
      };
      state.tenants.push(tenant);
      state.promptsByTenant[tenant.id] = [];
      state.dashboardOverview[tenant.id] = {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        rangeDays: 14,
        stats: {
          totalPrompts: { value: 0, previous: 0 },
          usageToday: { value: 0, previous: 0 },
          usageThisWeek: { value: 0, previous: 0 },
          activePrompts: { value: 0, previous: 0 },
          recentlyUpdated: { value: 0, previous: 0 }
        },
        trend: [],
        topPrompts: []
      };
      state.analytics[tenant.id] = {
        7: { data: [], tenant, rangeDays: 7 },
        14: { data: [], tenant, rangeDays: 14 },
        30: { data: [], tenant, rangeDays: 30 }
      };
      await fulfillJson(route, 201, { data: tenant });
      return;
    }

    await route.continue();
  });

  await page.route("**/prompts*", async (route, request) => {
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 1 && segments[0] === "prompts") {
      if (method === "GET") {
        const tenantId = url.searchParams.get("tenantId") ?? request.headers()["x-tenant-id"];
        if (!tenantId) {
          await fulfillJson(route, 400, { error: "Missing tenantId" });
          return;
        }

        if (await maybeFail(route, "prompts", tenantId)) return;

        const search = url.searchParams.get("search")?.toLowerCase() ?? "";
        const tag = url.searchParams.get("tag") ?? undefined;
        const metadataKey = url.searchParams.get("metadataKey") ?? undefined;
        const metadataValue = url.searchParams.get("metadataValue")?.toLowerCase() ?? undefined;
        const sortBy = (url.searchParams.get("sortBy") as SortField) ?? "updated_at";
        const order = (url.searchParams.get("order") as SortOrder) ?? "desc";
        const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") ?? "20", 10);

        let prompts = [...(state.promptsByTenant[tenantId] ?? [])];

        if (search) {
          prompts = prompts.filter((prompt) => {
            const haystack = [
              prompt.title,
              prompt.body,
              prompt.tags.join(" "),
              JSON.stringify(prompt.metadata ?? {})
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(search);
          });
        }

        if (tag) {
          prompts = prompts.filter((prompt) => prompt.tags.includes(tag));
        }

        if (metadataKey) {
          prompts = prompts.filter((prompt) => {
            if (!prompt.metadata) return false;
            const value = prompt.metadata[metadataKey];
            if (metadataValue) {
              return String(value ?? "")
                .toLowerCase()
                .includes(metadataValue);
            }
            return value !== undefined;
          });
        }

        prompts.sort((a, b) => {
          let lhs: string | number = 0;
          let rhs: string | number = 0;
          if (sortBy === "title") {
            lhs = a.title.toLowerCase();
            rhs = b.title.toLowerCase();
          } else if (sortBy === "created_at") {
            lhs = new Date(a.createdAt).getTime();
            rhs = new Date(b.createdAt).getTime();
          } else {
            lhs = new Date(a.updatedAt).getTime();
            rhs = new Date(b.updatedAt).getTime();
          }
          if (lhs < rhs) return order === "asc" ? -1 : 1;
          if (lhs > rhs) return order === "asc" ? 1 : -1;
          return 0;
        });

        const total = prompts.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        const response: PromptListResponse = {
          data: prompts.slice(start, end),
          pagination: { page, pageSize, total, totalPages },
          sort: sortBy,
          order,
          filters: { search: search || undefined, tag, metadataKey, metadataValue }
        };

        await fulfillJson(route, 200, response);
        return;
      }

      if (method === "POST") {
        const payload = JSON.parse(request.postData() || "{}");
        const tenantId = payload.tenantId;
        if (!tenantId) {
          await fulfillJson(route, 400, { error: "Missing tenantId" });
          return;
        }
        const now = new Date().toISOString();
        const prompt: Prompt = {
          id: __nextId("prompt"),
          tenantId,
          title: payload.title,
          body: payload.body,
          tags: payload.tags ?? [],
          metadata: payload.metadata ?? null,
          createdAt: now,
          updatedAt: now,
          version: 1,
          archived: Boolean(payload.archived),
          createdBy: payload.createdBy ?? null
        };
        state.promptsByTenant[tenantId] = state.promptsByTenant[tenantId] ?? [];
        state.promptsByTenant[tenantId].unshift(prompt);
        state.promptVersions[prompt.id] = [
          {
            version: 1,
            title: prompt.title,
            body: prompt.body,
            tags: prompt.tags,
            metadata: prompt.metadata,
            createdAt: now,
            createdBy: prompt.createdBy
          }
        ];
        await fulfillJson(route, 201, { data: prompt });
        return;
      }
    }

    if (segments.length === 2 && segments[0] === "prompts" && method === "PUT") {
      const promptId = segments[1];
      const payload = JSON.parse(request.postData() || "{}");
      const tenantId = request.headers()["x-tenant-id"] ?? payload.tenantId;
      if (!tenantId) {
        await fulfillJson(route, 400, { error: "Missing tenantId" });
        return;
      }
      const prompts = state.promptsByTenant[tenantId] ?? [];
      const target = prompts.find((item) => item.id === promptId);
      if (!target) {
        await fulfillJson(route, 404, { error: "Prompt not found" });
        return;
      }
      const now = new Date().toISOString();
      Object.assign(target, {
        title: payload.title ?? target.title,
        body: payload.body ?? target.body,
        tags: payload.tags ?? target.tags,
        metadata: payload.metadata ?? target.metadata,
        archived: payload.archived ?? target.archived,
        createdBy: payload.createdBy ?? target.createdBy,
        updatedAt: now,
        version: target.version + 1
      });
      state.promptVersions[promptId] = state.promptVersions[promptId] ?? [];
      state.promptVersions[promptId].unshift({
        version: target.version,
        title: target.title,
        body: target.body,
        tags: target.tags,
        metadata: target.metadata,
        createdAt: now,
        createdBy: target.createdBy
      });
      await fulfillJson(route, 200, { data: target });
      return;
    }

    if (segments.length === 2 && segments[0] === "prompts" && method === "DELETE") {
      const promptId = segments[1];
      const tenantId = request.headers()["x-tenant-id"];
      if (!tenantId) {
        await fulfillJson(route, 400, { error: "Missing tenantId" });
        return;
      }
      state.promptsByTenant[tenantId] = (state.promptsByTenant[tenantId] ?? []).filter(
        (prompt) => prompt.id !== promptId
      );
      delete state.promptVersions[promptId];
      delete state.promptComments[promptId];
      delete state.promptShares[promptId];
      delete state.promptApprovals[promptId];
      delete state.promptActivity[promptId];
      await route.fulfill({ status: 204 });
      return;
    }

    if (segments.length === 3 && segments[0] === "prompts" && segments[2] === "versions") {
      const promptId = segments[1];
      await fulfillJson(route, 200, { data: state.promptVersions[promptId] ?? [] });
      return;
    }

    if (segments.length === 3 && segments[0] === "prompts" && segments[2] === "usage") {
      const promptId = segments[1];
      const tenantId = request.headers()["x-tenant-id"];
      if (!tenantId) {
        await fulfillJson(route, 400, { error: "Missing tenantId" });
        return;
      }
      const now = new Date().toISOString();
      state.promptActivity[promptId] = state.promptActivity[promptId] ?? [];
      state.promptActivity[promptId].unshift({
        id: __nextId("activity"),
        promptId,
        tenantId,
        actor: request.headers()["authorization"] ? "authenticated" : "system",
        action: "usage_recorded",
        metadata: null,
        createdAt: now
      });
      await route.fulfill({ status: 204 });
      return;
    }

    if (segments.length === 3 && segments[0] === "prompts" && segments[2] === "comments") {
      const promptId = segments[1];
      if (method === "GET") {
        await fulfillJson(route, 200, { data: state.promptComments[promptId] ?? [] });
        return;
      }
      if (method === "POST") {
        const payload = JSON.parse(request.postData() || "{}");
        const now = new Date().toISOString();
        const comment: PromptComment = {
          id: __nextId("comment"),
          promptId,
          tenantId: request.headers()["x-tenant-id"] ?? "tenant_acme",
          parentId: payload.parentId ?? null,
          body: payload.body,
          createdBy: "e2e-user",
          createdAt: now,
          updatedAt: now,
          resolved: false
        };
        state.promptComments[promptId] = state.promptComments[promptId] ?? [];
        state.promptComments[promptId].push(comment);
        await fulfillJson(route, 201, { data: comment });
        return;
      }
    }

    if (segments.length === 3 && segments[0] === "prompts" && segments[2] === "shares") {
      const promptId = segments[1];
      if (method === "GET") {
        await fulfillJson(route, 200, { data: state.promptShares[promptId] ?? [] });
        return;
      }
      if (method === "POST") {
        const payload = JSON.parse(request.postData() || "{}");
        const now = new Date().toISOString();
        const share: PromptShare = {
          id: __nextId("share"),
          promptId,
          tenantId: request.headers()["x-tenant-id"] ?? "tenant_acme",
          targetType: payload.targetType,
          targetIdentifier: payload.targetIdentifier,
          role: payload.role,
          createdBy: "e2e-user",
          createdAt: now,
          expiresAt: payload.expiresAt ?? null
        };
        state.promptShares[promptId] = state.promptShares[promptId] ?? [];
        state.promptShares[promptId].push(share);
        await fulfillJson(route, 200, { data: state.promptShares[promptId] });
        return;
      }
    }

    if (
      segments.length === 4 &&
      segments[0] === "prompts" &&
      segments[2] === "shares" &&
      method === "DELETE"
    ) {
      const promptId = segments[1];
      const shareId = segments[3];
      state.promptShares[promptId] = (state.promptShares[promptId] ?? []).filter(
        (share) => share.id !== shareId
      );
      await fulfillJson(route, 200, { data: state.promptShares[promptId] });
      return;
    }

    if (segments.length === 3 && segments[0] === "prompts" && segments[2] === "approvals") {
      const promptId = segments[1];
      if (method === "GET") {
        await fulfillJson(route, 200, { data: state.promptApprovals[promptId] ?? [] });
        return;
      }
      if (method === "POST") {
        const payload = JSON.parse(request.postData() || "{}");
        const now = new Date().toISOString();
        const approval: PromptApproval = {
          id: __nextId("approval"),
          promptId,
          tenantId: request.headers()["x-tenant-id"] ?? "tenant_acme",
          requestedBy: "e2e-user",
          approver: payload.approver,
          status: "pending",
          message: payload.message ?? null,
          createdAt: now,
          updatedAt: now
        };
        state.promptApprovals[promptId] = state.promptApprovals[promptId] ?? [];
        state.promptApprovals[promptId].push(approval);
        await fulfillJson(route, 200, { data: state.promptApprovals[promptId] });
        return;
      }
    }

    if (segments.length === 3 && segments[0] === "prompts" && segments[2] === "activity") {
      const promptId = segments[1];
      await fulfillJson(route, 200, { data: state.promptActivity[promptId] ?? [] });
      return;
    }

    await route.continue();
  });

  await page.route("**/comments/*", async (route, request) => {
    const url = new URL(request.url());
    const commentId = url.pathname.split("/").pop()!;
    if (request.method() === "PATCH") {
      const payload = JSON.parse(request.postData() || "{}");
      Object.values(state.promptComments).forEach((comments) => {
        const target = comments.find((comment) => comment.id === commentId);
        if (target) {
          if (payload.resolved !== undefined) target.resolved = payload.resolved;
          if (payload.body !== undefined) target.body = payload.body;
          target.updatedAt = new Date().toISOString();
        }
      });
      const updated = Object.values(state.promptComments)
        .flat()
        .find((c) => c.id === commentId);
      await fulfillJson(route, 200, { data: updated });
      return;
    }
    if (request.method() === "DELETE") {
      Object.keys(state.promptComments).forEach((promptId) => {
        state.promptComments[promptId] = (state.promptComments[promptId] ?? []).filter(
          (comment) => comment.id !== commentId && comment.parentId !== commentId
        );
      });
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
  });

  await page.route("**/approvals/*", async (route, request) => {
    if (request.method() === "PATCH") {
      const url = new URL(request.url());
      const approvalId = url.pathname.split("/").pop()!;
      const payload = JSON.parse(request.postData() || "{}");
      const approval = Object.values(state.promptApprovals)
        .flat()
        .find((entry) => entry.id === approvalId);
      if (!approval) {
        await fulfillJson(route, 404, { error: "Approval not found" });
        return;
      }
      approval.status = payload.status ?? approval.status;
      approval.message = payload.message ?? approval.message;
      approval.updatedAt = new Date().toISOString();
      await fulfillJson(route, 200, { data: approval });
      return;
    }
    await route.continue();
  });

  await page.route("**/analytics/overview*", async (route, request) => {
    const url = new URL(request.url());
    const tenantId = request.headers()["x-tenant-id"] ?? url.searchParams.get("tenantId") ?? "";
    if (await maybeFail(route, "dashboard", tenantId)) return;
    const overview = state.dashboardOverview[tenantId];
    if (!overview) {
      await fulfillJson(route, 404, { error: "Tenant not found" });
      return;
    }
    await fulfillJson(route, 200, { data: overview });
  });

  await page.route("**/analytics/prompts*", async (route, request) => {
    const url = new URL(request.url());
    const tenantId = request.headers()["x-tenant-id"] ?? url.searchParams.get("tenantId") ?? "";
    const range = Number.parseInt(url.searchParams.get("range") ?? "30", 10);
    if (await maybeFail(route, "analytics", tenantId, String(range))) return;
    const dataset = state.analytics[tenantId]?.[range];
    if (!dataset) {
      await fulfillJson(route, 404, { error: "Analytics not found" });
      return;
    }
    await fulfillJson(route, 200, dataset);
  });

  await page.route("**/notifications*", async (route, request) => {
    if (await maybeFail(route, "notifications")) return;
    if (request.method() === "GET") {
      await fulfillJson(route, 200, { data: state.notifications });
      return;
    }
    if (request.method() === "PATCH") {
      const url = new URL(request.url());
      const id = url.pathname.split("/").pop()!;
      const notification = state.notifications.find((item) => item.id === id);
      if (notification) {
        notification.readAt = new Date().toISOString();
      }
      await fulfillJson(route, 200, { data: notification });
      return;
    }
    await route.continue();
  });

  return state;
}

export type {
  Tenant,
  Prompt,
  PromptComment,
  PromptShare,
  PromptApproval,
  PromptActivityEntry,
  PromptAnalyticsResponse,
  PromptVersion,
  NotificationItem,
  ShareRole,
  ShareTargetType,
  ApprovalStatus,
  SortField,
  SortOrder,
  PromptListResponse
};
