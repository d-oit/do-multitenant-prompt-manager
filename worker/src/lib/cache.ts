import type { Env } from "../types";
import type { Logger } from "./logger";

const DEFAULT_STALE_SECONDS = 120;

interface CacheEnvelope<T> {
  payload: T;
  cachedAt: number;
  expiresAt: number;
  staleAt: number;
  tags: string[];
}

interface CacheReadResult<T> {
  payload: T;
  freshness: "fresh" | "stale";
}

export interface CacheStoreOptions {
  ttlSeconds: number;
  staleSeconds?: number;
  tags?: string[];
}

export function buildCacheKey(parts: Record<string, unknown>): string {
  const normalizedEntries = Object.entries(parts)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}:${String(value)}`);
  return `list:${normalizedEntries.join("|")}`;
}

export async function readJsonCache<T>(env: Env, key: string): Promise<CacheReadResult<T> | null> {
  const raw = await env.PROMPT_CACHE.get<CacheEnvelope<T>>(key, { type: "json" });
  if (!raw) {
    return null;
  }

  const now = Date.now();
  if (now >= raw.staleAt) {
    return null;
  }

  return {
    payload: raw.payload,
    freshness: now < raw.expiresAt ? "fresh" : "stale"
  };
}

export async function writeJsonCache<T>(
  env: Env,
  key: string,
  payload: T,
  options: CacheStoreOptions,
  logger?: Logger
): Promise<void> {
  const ttl = Math.max(1, options.ttlSeconds);
  const staleWindow = Math.max(1, options.staleSeconds ?? DEFAULT_STALE_SECONDS);
  const now = Date.now();
  const envelope: CacheEnvelope<T> = {
    payload,
    cachedAt: now,
    expiresAt: now + ttl * 1000,
    staleAt: now + (ttl + staleWindow) * 1000,
    tags: options.tags ?? []
  };

  await env.PROMPT_CACHE.put(key, JSON.stringify(envelope), {
    expirationTtl: ttl + staleWindow
  });

  if (envelope.tags.length) {
    await Promise.all(
      envelope.tags.map((tag) =>
        env.PROMPT_CACHE.put(tagKey(tag, key), "1", { expirationTtl: ttl + staleWindow }).catch((error) => {
          logger?.warn("cache.tag_error", { tag, key, error: String(error) });
        })
      )
    );
  }
}

export async function invalidateByTag(env: Env, tag: string, logger?: Logger): Promise<void> {
  const prefix = `tag:${tag}:`;
  let cursor: string | undefined;
  const keysToDelete = new Set<string>();

  do {
    const { keys, list_complete, cursor: next } = await env.PROMPT_CACHE.list({ prefix, cursor });
    keys.forEach((entry) => {
      const cacheKey = entry.name.replace(prefix, "");
      if (cacheKey) {
        keysToDelete.add(cacheKey);
      }
    });
    cursor = list_complete ? undefined : next;
  } while (cursor);

  if (!keysToDelete.size) {
    logger?.debug("cache.invalidate.skip", { tag });
    return;
  }

  await Promise.all(
    Array.from(keysToDelete).flatMap((cacheKey) => [
      env.PROMPT_CACHE.delete(cacheKey),
      env.PROMPT_CACHE.delete(tagKey(tag, cacheKey))
    ])
  );

  logger?.info("cache.invalidate.tag", { tag, entries: keysToDelete.size });
}

export async function clearListCache(env: Env, logger: Logger, tenantId?: string): Promise<void> {
  const tags = ["list"];
  if (tenantId) {
    tags.push(`list:tenant:${tenantId}`);
    tags.push(`list:search:${tenantId}`);
  }
  await Promise.all(tags.map((tag) => invalidateByTag(env, tag, logger)));
}

export async function recordCacheMetric(env: Env, event: string, logger?: Logger): Promise<void> {
  try {
    const key = "meta:cache:metrics";
    const current = await env.PROMPT_CACHE.get<Record<string, number>>(key, { type: "json" });
    const next = { ...(current ?? {}), [event]: (current?.[event] ?? 0) + 1, updatedAt: Date.now() };
    await env.PROMPT_CACHE.put(key, JSON.stringify(next), { expirationTtl: 24 * 60 * 60 });
  } catch (error) {
    logger?.debug("cache.metric.error", { event, error: String(error) });
  }
}

export function buildPromptCacheKey(id: string): string {
  return `prompt:${id}`;
}

export function buildPromptTag(id: string): string {
  return `prompt:${id}`;
}

export function buildTenantPromptTag(tenantId: string): string {
  return `prompt:tenant:${tenantId}`;
}

export function buildTenantListTag(tenantId: string): string {
  return `list:tenant:${tenantId}`;
}

function tagKey(tag: string, cacheKey: string): string {
  return `tag:${tag}:${cacheKey}`;
}
