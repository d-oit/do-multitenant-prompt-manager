import type { Env } from "../types";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

export interface ApprovalRecord {
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

export async function createApproval(env: Env, record: ApprovalRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prompt_approval_requests (id, prompt_id, tenant_id, requested_by, approver, status, message, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      record.id,
      record.promptId,
      record.tenantId,
      record.requestedBy,
      record.approver,
      record.status,
      record.message,
      record.createdAt,
      record.updatedAt
    )
    .run();
}

export async function updateApprovalStatus(
  env: Env,
  approvalId: string,
  tenantId: string,
  status: ApprovalStatus,
  message: string | null
): Promise<ApprovalRecord | null> {
  const existing = await env.DB.prepare(
    `SELECT id, prompt_id, tenant_id, requested_by, approver, status, message, created_at, updated_at
     FROM prompt_approval_requests
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(approvalId, tenantId)
    .first<{
      id: string;
      prompt_id: string;
      tenant_id: string;
      requested_by: string;
      approver: string;
      status: string;
      message: string | null;
      created_at: string;
      updated_at: string;
    }>();

  if (!existing) {
    return null;
  }

  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE prompt_approval_requests SET status = ?, message = ?, updated_at = ? WHERE id = ?`
  )
    .bind(status, message, updatedAt, approvalId)
    .run();

  return {
    id: existing.id,
    promptId: existing.prompt_id,
    tenantId: existing.tenant_id,
    requestedBy: existing.requested_by,
    approver: existing.approver,
    status,
    message,
    createdAt: existing.created_at,
    updatedAt
  };
}

export async function listApprovals(
  env: Env,
  promptId: string,
  tenantId: string
): Promise<ApprovalRecord[]> {
  const rows = await env.DB.prepare(
    `SELECT id, prompt_id, tenant_id, requested_by, approver, status, message, created_at, updated_at
     FROM prompt_approval_requests
     WHERE prompt_id = ? AND tenant_id = ?
     ORDER BY created_at DESC`
  )
    .bind(promptId, tenantId)
    .all<{
      id: string;
      prompt_id: string;
      tenant_id: string;
      requested_by: string;
      approver: string;
      status: string;
      message: string | null;
      created_at: string;
      updated_at: string;
    }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    promptId: row.prompt_id,
    tenantId: row.tenant_id,
    requestedBy: row.requested_by,
    approver: row.approver,
    status: row.status as ApprovalStatus,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
