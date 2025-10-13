import type { Env } from "../types";
import { assertPromptTenant } from "../repositories/promptRepository";
import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
  type CommentRecord
} from "../repositories/commentRepository";
import { logCommentActivity } from "../repositories/commentActivityRepository";
import { logActivity, type ActivityRecord, listActivity } from "../repositories/activityRepository";
import { addShare, listShares, removeShare, type ShareRecord } from "../repositories/shareRepository";
import {
  createApproval,
  listApprovals,
  updateApprovalStatus,
  type ApprovalRecord,
  type ApprovalStatus
} from "../repositories/approvalRepository";
import {
  createNotification,
  listNotifications,
  markNotificationRead,
  type NotificationRecord
} from "../repositories/notificationRepository";
import type { Prompt } from "../../shared/types";

interface CommentInput {
  promptId: string;
  tenantId: string;
  parentId?: string | null;
  body: string;
  actor: string;
}

interface ShareInput {
  promptId: string;
  tenantId: string;
  targetType: ShareRecord["targetType"];
  targetIdentifier: string;
  role: ShareRecord["role"];
  actor: string;
  expiresAt?: string | null;
}

interface ApprovalInput {
  promptId: string;
  tenantId: string;
  approver: string;
  message?: string | null;
  actor: string;
}

export async function getPromptOrThrow(env: Env, promptId: string, tenantId: string): Promise<Prompt> {
  const prompt = await assertPromptTenant(env, promptId, tenantId);
  if (!prompt) {
    throw new Error("Prompt not found");
  }
  return prompt;
}

export async function listPromptComments(env: Env, promptId: string, tenantId: string): Promise<CommentRecord[]> {
  await getPromptOrThrow(env, promptId, tenantId);
  return listComments(env, promptId, tenantId);
}

export async function addPromptComment(env: Env, input: CommentInput): Promise<CommentRecord> {
  const prompt = await getPromptOrThrow(env, input.promptId, input.tenantId);
  const record = await createComment(env, {
    id: crypto.randomUUID(),
    promptId: input.promptId,
    tenantId: input.tenantId,
    parentId: input.parentId ?? null,
    body: input.body,
    createdBy: input.actor,
    resolved: false
  });

  await logCommentActivity(env, {
    id: crypto.randomUUID(),
    commentId: record.id,
    promptId: record.promptId,
    tenantId: record.tenantId,
    action: "comment.created",
    actor: input.actor,
    metadata: { parentId: input.parentId ?? null },
    createdAt: record.createdAt
  });

  await appendActivity(env, {
    promptId: record.promptId,
    tenantId: record.tenantId,
    actor: input.actor,
    action: "comment_created",
    metadata: { commentId: record.id }
  });

  if (prompt.createdBy && prompt.createdBy !== input.actor) {
    await notify(env, {
      tenantId: prompt.tenantId,
      recipient: prompt.createdBy,
      type: "comment",
      message: `New comment on ${prompt.title}`,
      metadata: { promptId: prompt.id, commentId: record.id }
    });
  }

  return record;
}

export async function updatePromptComment(
  env: Env,
  commentId: string,
  tenantId: string,
  actor: string,
  updates: Partial<Pick<CommentRecord, "body" | "resolved">>
): Promise<CommentRecord> {
  const updated = await updateComment(env, commentId, tenantId, updates);
  if (!updated) {
    throw new Error("Comment not found");
  }

  await logCommentActivity(env, {
    id: crypto.randomUUID(),
    commentId,
    promptId: updated.promptId,
    tenantId: updated.tenantId,
    action: "comment.updated",
    actor,
    metadata: { updates },
    createdAt: updated.updatedAt
  });

  await appendActivity(env, {
    promptId: updated.promptId,
    tenantId: updated.tenantId,
    actor,
    action: updates.resolved !== undefined ? "comment_resolved" : "comment_updated",
    metadata: { commentId }
  });

  return updated;
}

export async function removePromptComment(env: Env, commentId: string, tenantId: string, actor: string): Promise<void> {
  const comment = await updateComment(env, commentId, tenantId, {});
  if (!comment) {
    throw new Error("Comment not found");
  }
  await deleteComment(env, commentId, tenantId);

  const timestamp = new Date().toISOString();
  await logCommentActivity(env, {
    id: crypto.randomUUID(),
    commentId,
    promptId: comment.promptId,
    tenantId: comment.tenantId,
    action: "comment.deleted",
    actor,
    metadata: null,
    createdAt: timestamp
  });
  await appendActivity(env, {
    promptId: comment.promptId,
    tenantId: comment.tenantId,
    actor,
    action: "comment_deleted",
    metadata: { commentId },
    createdAt: timestamp
  });
}

export async function listPromptShares(env: Env, promptId: string, tenantId: string): Promise<ShareRecord[]> {
  await getPromptOrThrow(env, promptId, tenantId);
  return listShares(env, promptId, tenantId);
}

export async function addPromptShare(env: Env, input: ShareInput): Promise<ShareRecord[]> {
  await getPromptOrThrow(env, input.promptId, input.tenantId);
  const now = new Date().toISOString();
  const record: ShareRecord = {
    id: crypto.randomUUID(),
    promptId: input.promptId,
    tenantId: input.tenantId,
    targetType: input.targetType,
    targetIdentifier: input.targetIdentifier,
    role: input.role,
    createdBy: input.actor,
    createdAt: now,
    expiresAt: input.expiresAt ?? null
  };

  await addShare(env, record);

  await appendActivity(env, {
    promptId: record.promptId,
    tenantId: record.tenantId,
    actor: input.actor,
    action: "share_added",
    metadata: {
      targetType: record.targetType,
      targetIdentifier: record.targetIdentifier,
      role: record.role
    },
    createdAt: now
  });

  return listShares(env, input.promptId, input.tenantId);
}

export async function removePromptShare(env: Env, promptId: string, tenantId: string, shareId: string, actor: string): Promise<ShareRecord[]> {
  await getPromptOrThrow(env, promptId, tenantId);
  const removed = await removeShare(env, shareId, tenantId);
  if (!removed) {
    throw new Error("Share not found");
  }

  await appendActivity(env, {
    promptId,
    tenantId,
    actor,
    action: "share_removed",
    metadata: { shareId }
  });

  return listShares(env, promptId, tenantId);
}

export async function requestApproval(env: Env, input: ApprovalInput): Promise<ApprovalRecord[]> {
  await getPromptOrThrow(env, input.promptId, input.tenantId);
  const timestamp = new Date().toISOString();
  const record: ApprovalRecord = {
    id: crypto.randomUUID(),
    promptId: input.promptId,
    tenantId: input.tenantId,
    requestedBy: input.actor,
    approver: input.approver,
    status: "pending",
    message: input.message ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await createApproval(env, record);

  await appendActivity(env, {
    promptId: record.promptId,
    tenantId: record.tenantId,
    actor: input.actor,
    action: "approval_requested",
    metadata: { approvalId: record.id }
  });

  await notify(env, {
    tenantId: record.tenantId,
    recipient: record.approver,
    type: "approval",
    message: `Approval requested for prompt ${record.promptId}`,
    metadata: { promptId: record.promptId, approvalId: record.id }
  });

  return listApprovals(env, input.promptId, input.tenantId);
}

export async function updateApproval(
  env: Env,
  approvalId: string,
  tenantId: string,
  actor: string,
  status: ApprovalStatus,
  message?: string | null
): Promise<ApprovalRecord> {
  const updated = await updateApprovalStatus(env, approvalId, tenantId, status, message ?? null);
  if (!updated) {
    throw new Error("Approval not found");
  }

  await appendActivity(env, {
    promptId: updated.promptId,
    tenantId: updated.tenantId,
    actor,
    action: "approval_updated",
    metadata: { approvalId, status }
  });

  await notify(env, {
    tenantId: updated.tenantId,
    recipient: updated.requestedBy,
    type: "approval",
    message: `Approval ${status} by ${actor}`,
    metadata: { promptId: updated.promptId, approvalId }
  });

  return updated;
}

export async function listPromptApprovals(env: Env, promptId: string, tenantId: string): Promise<ApprovalRecord[]> {
  await getPromptOrThrow(env, promptId, tenantId);
  return listApprovals(env, promptId, tenantId);
}

export async function listPromptActivity(env: Env, promptId: string, tenantId: string): Promise<ActivityRecord[]> {
  await getPromptOrThrow(env, promptId, tenantId);
  return listActivity(env, promptId, tenantId, 200);
}

export async function listUserNotifications(env: Env, recipient: string): Promise<NotificationRecord[]> {
  return listNotifications(env, recipient, 100);
}

export async function markNotificationAsRead(env: Env, notificationId: string, recipient: string): Promise<NotificationRecord> {
  const note = await markNotificationRead(env, notificationId, recipient);
  if (!note) {
    throw new Error("Notification not found");
  }
  return note;
}

async function appendActivity(
  env: Env,
  input: Omit<ActivityRecord, "id"> & { createdAt?: string }
): Promise<void> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  await logActivity(env, {
    id: crypto.randomUUID(),
    promptId: input.promptId,
    tenantId: input.tenantId,
    actor: input.actor ?? null,
    action: input.action,
    metadata: input.metadata ?? null,
    createdAt
  });
}

async function notify(
  env: Env,
  input: Omit<NotificationRecord, "id" | "createdAt" | "readAt"> & { readAt?: string | null }
): Promise<void> {
  await createNotification(env, {
    id: crypto.randomUUID(),
    tenantId: input.tenantId ?? null,
    recipient: input.recipient,
    type: input.type,
    message: input.message,
    metadata: input.metadata ?? null,
    readAt: input.readAt ?? null,
    createdAt: new Date().toISOString()
  });
}
