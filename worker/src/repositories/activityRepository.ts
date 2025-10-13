import type { Env } from "../types";

export interface ActivityRecord {
  id: string;
  promptId: string;
  tenantId: string;
  actor: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function logActivity(env: Env, record: ActivityRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prompt_activity_log (id, prompt_id, tenant_id, actor, action, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      record.id,
      record.promptId,
      record.tenantId,
      record.actor,
      record.action,
      record.metadata ? JSON.stringify(record.metadata) : null,
      record.createdAt
    )
    .run();
}

export async function listActivity(env: Env, promptId: string, tenantId: string, limit = 100): Promise<ActivityRecord[]> {
  const rows = await env.DB.prepare(
    `SELECT id, prompt_id, tenant_id, actor, action, metadata, created_at
     FROM prompt_activity_log
     WHERE prompt_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(promptId, tenantId, limit)
    .all<{
      id: string;
      prompt_id: string;
      tenant_id: string;
      actor: string | null;
      action: string;
      metadata: string | null;
      created_at: string;
    }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    promptId: row.prompt_id,
    tenantId: row.tenant_id,
    actor: row.actor,
    action: row.action,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
    createdAt: row.created_at
  }));
}
