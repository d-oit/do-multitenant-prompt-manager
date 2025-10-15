import type { ExecutionContext } from "@cloudflare/workers-types";
import type {
  Prompt,
  PromptFilters,
  PromptListResponse,
  PromptVersion,
  SortField
} from "../../../shared/types";
import type { Env } from "../types";
import type { Logger } from "../lib/logger";
import {
  buildCacheKey,
  buildTenantListTag,
  clearListCache,
  readJsonCache,
  recordCacheMetric,
  writeJsonCache
} from "../lib/cache";
import { serializeError, safeJsonParse } from "../lib/json";
import { searchPrompts } from "../lib/search";
import { fetchPrompt, invalidatePromptCaches, recordPromptVersion } from "../lib/prompts";

const LIST_CACHE_TTL = 60;
const LIST_CACHE_STALE = 120;
const SORT_COLUMN_MAP: Record<SortField, string> = {
  created_at: "created_at",
  updated_at: "updated_at",
  title: "title COLLATE NOCASE"
};

export interface PromptListQueryOptions {
  tenantId: string;
  search?: string;
  tag?: string;
  metadataKey?: string;
  metadataValue?: string;
  sortField: SortField;
  sortOrder: "ASC" | "DESC";
  page: number;
  pageSize: number;
  offset: number;
}

export interface CreatePromptData {
  tenantId: string;
  title: string;
  body: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  archived?: boolean;
  createdBy?: string | null;
}

export interface UpdatePromptData {
  title?: string;
  body?: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  archived?: boolean;
  createdBy?: string | null;
}

export async function listPrompts(
  env: Env,
  options: PromptListQueryOptions,
  logger: Logger,
  ctx: ExecutionContext
): Promise<PromptListResponse> {
  const cacheKey = buildCacheKey({
    tenantId: options.tenantId,
    search: options.search,
    tag: options.tag,
    metadataKey: options.metadataKey,
    metadataValue: options.metadataValue,
    sortField: options.sortField,
    order: options.sortOrder,
    page: options.page,
    pageSize: options.pageSize
  });

  const cacheTags = ["list", buildTenantListTag(options.tenantId)];
  if (options.search) {
    cacheTags.push(`list:search:${options.tenantId}`);
  }

  const cached = await readJsonCache<PromptListResponse>(env, cacheKey);
  if (cached) {
    await recordCacheMetric(env, cached.freshness === "fresh" ? "list.hit" : "list.stale", logger);
    if (cached.freshness === "fresh") {
      logger.debug("cache.list.hit", { key: cacheKey, tenantId: options.tenantId });
      return cached.payload;
    }

    logger.debug("cache.list.stale", { key: cacheKey, tenantId: options.tenantId });
    ctx.waitUntil(revalidateListCache(env, cacheKey, cacheTags, options, logger));
    return cached.payload;
  }

  await recordCacheMetric(env, "list.miss", logger);
  const payload = await buildPromptListPayload(env, options);
  await writeJsonCache(
    env,
    cacheKey,
    payload,
    {
      ttlSeconds: LIST_CACHE_TTL,
      staleSeconds: LIST_CACHE_STALE,
      tags: cacheTags
    },
    logger
  );
  await recordCacheMetric(env, "list.store", logger);

  return payload;
}

export async function createPrompt(
  env: Env,
  data: CreatePromptData,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Prompt> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(data.tags ?? []);
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
  const archivedFlag = data.archived ? 1 : 0;
  const createdBy = data.createdBy ?? null;

  await env.DB.prepare(
    `INSERT INTO prompts (id, tenant_id, title, body, tags, metadata, created_at, updated_at, version, archived, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      data.tenantId,
      data.title,
      data.body,
      tagsJson,
      metadataJson,
      now,
      now,
      1,
      archivedFlag,
      createdBy
    )
    .run();

  await recordPromptVersion(env, {
    promptId: id,
    tenantId: data.tenantId,
    version: 1,
    title: data.title,
    body: data.body,
    tagsJson,
    metadataJson,
    createdAt: now,
    createdBy
  });

  const prompt = await fetchPrompt(id, env, data.tenantId);
  if (!prompt) {
    throw new Error("Failed to load created prompt");
  }

  ctx.waitUntil(clearListCache(env, logger, data.tenantId));
  return prompt;
}

export async function getPrompt(
  env: Env,
  promptId: string,
  tenantId?: string
): Promise<Prompt | null> {
  return fetchPrompt(promptId, env, tenantId);
}

export async function updatePrompt(
  env: Env,
  existing: Prompt,
  updates: UpdatePromptData,
  logger: Logger,
  ctx: ExecutionContext
): Promise<Prompt> {
  const now = new Date().toISOString();

  const fields: string[] = [];
  const params: unknown[] = [];
  let nextVersion = existing.version;
  let shouldVersion = false;

  if (updates.title !== undefined) {
    fields.push("title = ?");
    params.push(updates.title);
    if (updates.title !== existing.title) {
      shouldVersion = true;
    }
  }

  if (updates.body !== undefined) {
    fields.push("body = ?");
    params.push(updates.body);
    if (updates.body !== existing.body) {
      shouldVersion = true;
    }
  }

  if (updates.tags !== undefined) {
    const tagsJson = JSON.stringify(updates.tags);
    fields.push("tags = ?");
    params.push(tagsJson);
    if (tagsJson !== JSON.stringify(existing.tags)) {
      shouldVersion = true;
    }
  }

  if (updates.metadata !== undefined) {
    const metadataJson = updates.metadata ? JSON.stringify(updates.metadata) : null;
    fields.push("metadata = ?");
    params.push(metadataJson);
    if (metadataJson !== (existing.metadata ? JSON.stringify(existing.metadata) : null)) {
      shouldVersion = true;
    }
  }

  if (updates.archived !== undefined) {
    fields.push("archived = ?");
    params.push(updates.archived ? 1 : 0);
  }

  if (fields.length === 0) {
    return existing;
  }

  if (shouldVersion) {
    nextVersion = existing.version + 1;
    fields.push("version = ?");
    params.push(nextVersion);
  }

  fields.push("updated_at = ?");
  params.push(now, existing.id);

  const statement = `UPDATE prompts SET ${fields.join(", ")} WHERE id = ?`;
  await env.DB.prepare(statement)
    .bind(...params)
    .run();

  await invalidatePromptCaches(env, existing.id, existing.tenantId, logger);

  let prompt = shouldVersion ? await fetchPrompt(existing.id, env, existing.tenantId) : null;

  if (shouldVersion && prompt) {
    await recordPromptVersion(env, {
      promptId: prompt.id,
      tenantId: prompt.tenantId,
      version: nextVersion,
      title: prompt.title,
      body: prompt.body,
      tagsJson: JSON.stringify(prompt.tags ?? []),
      metadataJson: prompt.metadata ? JSON.stringify(prompt.metadata) : null,
      createdAt: now,
      createdBy: updates.createdBy ?? null
    });
  }

  if (!prompt) {
    prompt = await fetchPrompt(existing.id, env, existing.tenantId);
  }

  if (!prompt) {
    throw new Error("Failed to load updated prompt");
  }

  ctx.waitUntil(clearListCache(env, logger, existing.tenantId));
  return prompt;
}

export async function deletePrompt(
  env: Env,
  prompt: Prompt,
  logger: Logger,
  ctx: ExecutionContext
): Promise<void> {
  await invalidatePromptCaches(env, prompt.id, prompt.tenantId, logger);

  await env.DB.prepare("DELETE FROM prompts WHERE id = ? AND tenant_id = ?")
    .bind(prompt.id, prompt.tenantId)
    .run();

  ctx.waitUntil(clearListCache(env, logger, prompt.tenantId));
}

export async function recordPromptUsage(
  env: Env,
  prompt: Prompt,
  metadata?: Record<string, unknown>
): Promise<string> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO prompt_usage_events (id, prompt_id, tenant_id, occurred_at, metadata)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      prompt.id,
      prompt.tenantId,
      now,
      metadata ? JSON.stringify(metadata) : null
    )
    .run();

  return now;
}

export async function listPromptVersions(
  env: Env,
  promptId: string,
  tenantId: string,
  limit: number
): Promise<{ prompt: Prompt; versions: PromptVersion[] }> {
  const prompt = await fetchPrompt(promptId, env, tenantId);
  if (!prompt) {
    throw new Error("Prompt not found");
  }

  const rows = await env.DB.prepare(
    `SELECT version, title, body, tags, metadata, created_at, created_by
     FROM prompt_versions
     WHERE prompt_id = ? AND tenant_id = ?
     ORDER BY version DESC
     LIMIT ?`
  )
    .bind(promptId, tenantId, limit)
    .all<{
      version: number;
      title: string;
      body: string;
      tags: string;
      metadata: string | null;
      created_at: string;
      created_by: string | null;
    }>();

  const versions: PromptVersion[] = (rows.results || []).map((row) => ({
    version: row.version,
    title: row.title,
    body: row.body,
    tags: safeJsonParse(row.tags, [] as string[]),
    metadata: safeJsonParse(row.metadata, null as Record<string, unknown> | null),
    createdAt: row.created_at,
    createdBy: row.created_by
  }));

  return { prompt, versions };
}

async function revalidateListCache(
  env: Env,
  cacheKey: string,
  tags: string[],
  options: PromptListQueryOptions,
  logger: Logger
): Promise<void> {
  try {
    const payload = await buildPromptListPayload(env, options);
    await writeJsonCache(
      env,
      cacheKey,
      payload,
      {
        ttlSeconds: LIST_CACHE_TTL,
        staleSeconds: LIST_CACHE_STALE,
        tags
      },
      logger
    );
    await recordCacheMetric(env, "list.revalidate", logger);
    logger.debug("cache.list.revalidated", { key: cacheKey, tenantId: options.tenantId });
  } catch (error) {
    logger.warn("cache.list.revalidate_error", {
      key: cacheKey,
      tenantId: options.tenantId,
      error: serializeError(error)
    });
  }
}

async function buildPromptListPayload(
  env: Env,
  options: PromptListQueryOptions
): Promise<PromptListResponse> {
  const filters: PromptFilters = {};
  if (options.search) filters.search = options.search;
  if (options.tag) filters.tag = options.tag;
  if (options.metadataKey) filters.metadataKey = options.metadataKey;
  if (options.metadataValue) filters.metadataValue = options.metadataValue;

  if (options.search) {
    const { hits, total } = await searchPrompts(env, {
      tenantId: options.tenantId,
      query: options.search,
      tag: options.tag,
      metadataKey: options.metadataKey,
      metadataValue: options.metadataValue,
      limit: options.pageSize,
      offset: options.offset
    });

    return {
      data: hits.map((hit) => hit.prompt),
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / options.pageSize))
      },
      sort: options.sortField,
      order: options.sortOrder === "ASC" ? "asc" : "desc",
      filters,
      highlights: hits.map((hit) => ({
        promptId: hit.prompt.id,
        title: hit.highlights.title ?? undefined,
        body: hit.highlights.body ?? undefined,
        tags: hit.highlights.tags ?? undefined,
        metadata: hit.highlights.metadata ?? undefined,
        relevance: Number.isFinite(hit.relevance) ? Number(hit.relevance.toFixed(6)) : undefined
      }))
    };
  }

  const conditions: string[] = ["tenant_id = ?", "archived = 0"];
  const baseParams: unknown[] = [options.tenantId];

  if (options.tag) {
    conditions.push("tags LIKE ?");
    baseParams.push(`%"${options.tag}"%`);
  }

  if (options.metadataKey && options.metadataValue) {
    conditions.push("metadata LIKE ?");
    baseParams.push(`%"${options.metadataKey}":"${options.metadataValue}"%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderColumn = SORT_COLUMN_MAP[options.sortField] ?? SORT_COLUMN_MAP.created_at;

  const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS total FROM prompts ${whereClause}`)
    .bind(...baseParams)
    .first<{ total: number }>();

  const total = Number(totalRow?.total ?? 0);

  const listQuery = `SELECT id, tenant_id, title, body, tags, metadata, created_at, updated_at, version, archived, created_by
    FROM prompts
    ${whereClause}
    ORDER BY ${orderColumn} ${options.sortOrder}
    LIMIT ? OFFSET ?`;

  const rows = await env.DB.prepare(listQuery)
    .bind(...baseParams, options.pageSize, options.offset)
    .all<{
      id: string;
      tenant_id: string;
      title: string;
      body: string;
      tags: string;
      metadata: string | null;
      created_at: string;
      updated_at: string;
      version: number;
      archived: number;
      created_by: string | null;
    }>();

  const prompts: Prompt[] = (rows.results || []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    body: row.body,
    tags: safeJsonParse(row.tags, [] as string[]),
    metadata: safeJsonParse(row.metadata, null as Record<string, unknown> | null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: typeof row.version === "number" ? row.version : Number(row.version ?? 1),
    archived: row.archived === 1,
    createdBy: row.created_by ?? null
  }));

  return {
    data: prompts,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / options.pageSize))
    },
    sort: options.sortField,
    order: options.sortOrder === "ASC" ? "asc" : "desc",
    filters,
    highlights: []
  };
}
