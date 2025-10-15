import type { Env } from "../types";

export interface ShareRecord {
  id: string;
  promptId: string;
  tenantId: string;
  targetType: "user" | "email" | "tenant";
  targetIdentifier: string;
  role: "viewer" | "editor" | "approver";
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
}

export async function addShare(env: Env, record: ShareRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prompt_shares (id, prompt_id, tenant_id, target_type, target_identifier, role, created_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      record.id,
      record.promptId,
      record.tenantId,
      record.targetType,
      record.targetIdentifier,
      record.role,
      record.createdBy,
      record.createdAt,
      record.expiresAt
    )
    .run();
}

export async function listShares(
  env: Env,
  promptId: string,
  tenantId: string
): Promise<ShareRecord[]> {
  const rows = await env.DB.prepare(
    `SELECT id, prompt_id, tenant_id, target_type, target_identifier, role, created_by, created_at, expires_at
     FROM prompt_shares
     WHERE prompt_id = ? AND tenant_id = ?`
  )
    .bind(promptId, tenantId)
    .all<{
      id: string;
      prompt_id: string;
      tenant_id: string;
      target_type: string;
      target_identifier: string;
      role: string;
      created_by: string;
      created_at: string;
      expires_at: string | null;
    }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    promptId: row.prompt_id,
    tenantId: row.tenant_id,
    targetType: row.target_type as ShareRecord["targetType"],
    targetIdentifier: row.target_identifier,
    role: row.role as ShareRecord["role"],
    createdBy: row.created_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  }));
}

export async function removeShare(env: Env, shareId: string, tenantId: string): Promise<boolean> {
  const result = await env.DB.prepare(`DELETE FROM prompt_shares WHERE id = ? AND tenant_id = ?`)
    .bind(shareId, tenantId)
    .run();

  return Boolean(result.success && (result.meta?.changes ?? 0) > 0);
}
