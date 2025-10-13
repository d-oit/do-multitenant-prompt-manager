import type { Env } from "../types";

export interface CommentRecord {
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

export async function listComments(env: Env, promptId: string, tenantId: string): Promise<CommentRecord[]> {
  const rows = await env.DB.prepare(
    `SELECT id, prompt_id, tenant_id, parent_id, body, created_by, created_at, updated_at, resolved
     FROM prompt_comments
     WHERE prompt_id = ? AND tenant_id = ?
     ORDER BY created_at ASC`
  )
    .bind(promptId, tenantId)
    .all<{
      id: string;
      prompt_id: string;
      tenant_id: string;
      parent_id: string | null;
      body: string;
      created_by: string;
      created_at: string;
      updated_at: string;
      resolved: number;
    }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    promptId: row.prompt_id,
    tenantId: row.tenant_id,
    parentId: row.parent_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolved: row.resolved === 1
  }));
}

export async function createComment(
  env: Env,
  input: Omit<CommentRecord, "id" | "createdAt" | "updatedAt" | "resolved"> & { id: string; resolved?: boolean }
): Promise<CommentRecord> {
  const createdAt = new Date().toISOString();
  const resolved = input.resolved ?? false;

  await env.DB.prepare(
    `INSERT INTO prompt_comments (id, prompt_id, tenant_id, parent_id, body, created_by, created_at, updated_at, resolved)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      input.id,
      input.promptId,
      input.tenantId,
      input.parentId,
      input.body,
      input.createdBy,
      createdAt,
      createdAt,
      resolved ? 1 : 0
    )
    .run();

  return {
    id: input.id,
    promptId: input.promptId,
    tenantId: input.tenantId,
    parentId: input.parentId,
    body: input.body,
    createdBy: input.createdBy,
    createdAt,
    updatedAt: createdAt,
    resolved
  };
}

export async function updateComment(
  env: Env,
  commentId: string,
  tenantId: string,
  updates: Partial<Pick<CommentRecord, "body" | "resolved">>
): Promise<CommentRecord | null> {
  const current = await env.DB.prepare(
    `SELECT id, prompt_id, tenant_id, parent_id, body, created_by, created_at, updated_at, resolved
     FROM prompt_comments
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(commentId, tenantId)
    .first<{
      id: string;
      prompt_id: string;
      tenant_id: string;
      parent_id: string | null;
      body: string;
      created_by: string;
      created_at: string;
      updated_at: string;
      resolved: number;
    }>();

  if (!current) {
    return null;
  }

  const nextBody = updates.body ?? current.body;
  const nextResolved = updates.resolved ?? (current.resolved === 1);
  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE prompt_comments
     SET body = ?, resolved = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(nextBody, nextResolved ? 1 : 0, updatedAt, commentId)
    .run();

  return {
    id: current.id,
    promptId: current.prompt_id,
    tenantId: current.tenant_id,
    parentId: current.parent_id,
    body: nextBody,
    createdBy: current.created_by,
    createdAt: current.created_at,
    updatedAt,
    resolved: nextResolved
  };
}

export async function deleteComment(env: Env, commentId: string, tenantId: string): Promise<boolean> {
  const result = await env.DB.prepare(
    `DELETE FROM prompt_comments WHERE id = ? AND tenant_id = ?`
  )
    .bind(commentId, tenantId)
    .run();

  return Boolean(result.success && (result.changes ?? 0) > 0);
}
