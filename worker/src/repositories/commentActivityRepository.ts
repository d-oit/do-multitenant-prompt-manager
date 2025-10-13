import type { Env } from "../types";

export interface CommentActivityRecord {
  id: string;
  commentId: string;
  promptId: string;
  tenantId: string;
  action: string;
  actor: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function logCommentActivity(env: Env, record: CommentActivityRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO prompt_comment_activity (id, comment_id, prompt_id, tenant_id, action, actor, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      record.id,
      record.commentId,
      record.promptId,
      record.tenantId,
      record.action,
      record.actor,
      record.metadata ? JSON.stringify(record.metadata) : null,
      record.createdAt
    )
    .run();
}
