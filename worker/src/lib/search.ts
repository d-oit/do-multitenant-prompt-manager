import type { Prompt } from "../../../shared/types";
import type { Env } from "../types";
import { deserializePrompt, type PromptRow } from "./prompts";

interface PromptSearchParams {
  tenantId: string;
  query: string;
  tag?: string;
  metadataKey?: string;
  metadataValue?: string;
  limit: number;
  offset: number;
}

interface PromptSearchHit {
  prompt: Prompt;
  relevance: number;
  highlights: {
    title?: string | null;
    body?: string | null;
    tags?: string | null;
    metadata?: string | null;
  };
}

export interface PromptSearchResult {
  hits: PromptSearchHit[];
  total: number;
}

export interface PromptSuggestion {
  id: string;
  title: string;
  tenantId: string;
  highlight?: string | null;
}

const MAX_TERMS = 8;

export function buildFtsMatch(query: string): string | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/["'`*~^:+-]/g, ""))
    .filter((token) => token.length > 0)
    .slice(0, MAX_TERMS);

  if (!tokens.length) {
    return null;
  }

  return tokens.map((token) => `${token}*`).join(" AND ");
}

export async function searchPrompts(
  env: Env,
  params: PromptSearchParams
): Promise<PromptSearchResult> {
  const match = buildFtsMatch(params.query);
  if (!match) {
    return { hits: [], total: 0 };
  }

  const where: string[] = ["p.tenant_id = ?", "p.archived = 0", "prompts_fts MATCH ?"];
  const bindings: unknown[] = [params.tenantId, match];

  if (params.tag) {
    where.push("p.tags LIKE ?");
    bindings.push(`%"${params.tag}"%`);
  }

  if (params.metadataKey && params.metadataValue) {
    where.push("p.metadata LIKE ?");
    bindings.push(`%"${params.metadataKey}":"${params.metadataValue}"%`);
  }

  const whereClause = `WHERE ${where.join(" AND ")}`;

  const result = await env.DB.prepare(
    `SELECT p.*, 
            (1.0 / (1.0 + bm25(prompts_fts))) AS relevance,
            highlight(prompts_fts, 0, '<mark>', '</mark>') AS title_highlight,
            snippet(prompts_fts, 1, '<mark>', '</mark>', '…', 42) AS body_snippet,
            snippet(prompts_fts, 2, '<mark>', '</mark>', '…', 32) AS tags_snippet,
            snippet(prompts_fts, 3, '<mark>', '</mark>', '…', 32) AS metadata_snippet
       FROM prompts_fts
       JOIN prompts p ON p.rowid = prompts_fts.rowid
       ${whereClause}
       ORDER BY relevance DESC, p.updated_at DESC
       LIMIT ? OFFSET ?`
  )
    .bind(...bindings, params.limit, params.offset)
    .all<PromptRow & {
      relevance: number;
      title_highlight: string | null;
      body_snippet: string | null;
      tags_snippet: string | null;
      metadata_snippet: string | null;
    }>();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) as count
       FROM prompts_fts
       JOIN prompts p ON p.rowid = prompts_fts.rowid
       ${whereClause}`
  )
    .bind(...bindings)
    .first<{ count: number }>();

  const hits: PromptSearchHit[] = (result.results ?? []).map((row) => ({
    prompt: deserializePrompt(row),
    relevance: Number(row.relevance ?? 0),
    highlights: {
      title: row.title_highlight,
      body: row.body_snippet,
      tags: row.tags_snippet,
      metadata: row.metadata_snippet
    }
  }));

  return {
    hits,
    total: totalRow?.count ?? hits.length
  };
}

export async function fetchPromptSuggestions(env: Env, tenantId: string, query: string, limit = 5): Promise<PromptSuggestion[]> {
  const match = buildFtsMatch(query);
  if (!match) {
    return [];
  }

  const suggestions = await env.DB.prepare(
    `SELECT p.id,
            p.title,
            p.tenant_id,
            highlight(prompts_fts, 0, '<mark>', '</mark>') AS title_highlight,
            (1.0 / (1.0 + bm25(prompts_fts))) AS relevance
       FROM prompts_fts
       JOIN prompts p ON p.rowid = prompts_fts.rowid
      WHERE p.tenant_id = ?
        AND p.archived = 0
        AND prompts_fts MATCH ?
      ORDER BY relevance DESC, p.updated_at DESC
      LIMIT ?`
  )
    .bind(tenantId, match, limit)
    .all<{ id: string; title: string; tenant_id: string; title_highlight: string | null }>();

  return (suggestions.results ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    tenantId: row.tenant_id,
    highlight: row.title_highlight
  }));
}
