import type { Prompt } from "../../shared/types";
import type { Env } from "../types";
import { safeJsonParse } from "./json";
import {
  buildPromptCacheKey,
  buildPromptTag,
  buildTenantPromptTag,
  readJsonCache,
  recordCacheMetric,
  writeJsonCache,
  invalidateByTag
} from "./cache";
import type { Logger } from "./logger";

export interface PromptRow {
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
}

export interface PromptVersionInput {
  promptId: string;
  tenantId: string;
  version: number;
  title: string;
  body: string;
  tagsJson: string;
  metadataJson: string | null;
  createdAt: string;
  createdBy: string | null;
}

export function deserializePrompt(row: PromptRow): Prompt {
  return {
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
  };
}

const PROMPT_CACHE_TTL = 300;
const PROMPT_CACHE_STALE = 180;

export async function fetchPrompt(id: string, env: Env, tenantId?: string): Promise<Prompt | null> {
  const cacheKey = buildPromptCacheKey(id);
  const cached = await readJsonCache<Prompt>(env, cacheKey);

  if (cached) {
    await recordCacheMetric(env, cached.freshness === "fresh" ? "prompt.hit" : "prompt.stale");
    if (tenantId && cached.payload.tenantId !== tenantId) {
      return null;
    }
    return cached.payload;
  }

  await recordCacheMetric(env, "prompt.miss");

  let query = "SELECT * FROM prompts WHERE id = ?";
  const params: unknown[] = [id];

  if (tenantId) {
    query += " AND tenant_id = ?";
    params.push(tenantId);
  }

  const record = await env.DB.prepare(query)
    .bind(...params)
    .first<PromptRow>();
  if (!record) {
    return null;
  }

  const prompt = deserializePrompt(record);

  await writeJsonCache(env, cacheKey, prompt, {
    ttlSeconds: PROMPT_CACHE_TTL,
    staleSeconds: PROMPT_CACHE_STALE,
    tags: [buildPromptTag(prompt.id), buildTenantPromptTag(prompt.tenantId)]
  });

  return prompt;
}

export async function recordPromptVersion(env: Env, input: PromptVersionInput): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prompt_versions (id, prompt_id, tenant_id, version, title, body, tags, metadata, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      input.promptId,
      input.tenantId,
      input.version,
      input.title,
      input.body,
      input.tagsJson,
      input.metadataJson,
      input.createdAt,
      input.createdBy
    )
    .run();
}

export async function invalidatePromptCaches(
  env: Env,
  promptId: string,
  tenantId: string,
  logger: Logger
): Promise<void> {
  await Promise.all([
    env.PROMPT_CACHE.delete(buildPromptCacheKey(promptId)),
    invalidateByTag(env, buildPromptTag(promptId), logger),
    invalidateByTag(env, buildTenantPromptTag(tenantId), logger)
  ]);
}
