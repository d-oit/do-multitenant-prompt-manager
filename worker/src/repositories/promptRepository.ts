import type { Env } from "../types";
import type { Prompt } from "../../../shared/types";
import { deserializePrompt } from "../lib/prompts";

interface PromptRow {
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

export async function findPromptById(env: Env, promptId: string): Promise<Prompt | null> {
  const row = await env.DB.prepare(
    `SELECT id, tenant_id, title, body, tags, metadata, created_at, updated_at, version, archived, created_by
     FROM prompts
     WHERE id = ?`
  )
    .bind(promptId)
    .first<PromptRow>();

  if (!row) {
    return null;
  }

  return deserializePrompt(row);
}

export async function assertPromptTenant(
  env: Env,
  promptId: string,
  tenantId: string
): Promise<Prompt | null> {
  const row = await env.DB.prepare(
    `SELECT id, tenant_id, title, body, tags, metadata, created_at, updated_at, version, archived, created_by
     FROM prompts
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(promptId, tenantId)
    .first<PromptRow>();

  if (!row) {
    return null;
  }

  return deserializePrompt(row);
}
