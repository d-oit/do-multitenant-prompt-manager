import type { Env } from "../types";

export interface NotificationRecord {
  id: string;
  tenantId: string | null;
  recipient: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export async function createNotification(env: Env, notification: NotificationRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO notifications (id, tenant_id, recipient, type, message, metadata, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      notification.id,
      notification.tenantId,
      notification.recipient,
      notification.type,
      notification.message,
      notification.metadata ? JSON.stringify(notification.metadata) : null,
      notification.readAt,
      notification.createdAt
    )
    .run();
}

export async function listNotifications(env: Env, recipient: string, limit = 50): Promise<NotificationRecord[]> {
  const rows = await env.DB.prepare(
    `SELECT id, tenant_id, recipient, type, message, metadata, read_at, created_at
     FROM notifications
     WHERE recipient = ?
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(recipient, limit)
    .all<{
      id: string;
      tenant_id: string | null;
      recipient: string;
      type: string;
      message: string;
      metadata: string | null;
      read_at: string | null;
      created_at: string;
    }>();

  return (rows.results ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    recipient: row.recipient,
    type: row.type,
    message: row.message,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
    readAt: row.read_at,
    createdAt: row.created_at
  }));
}

export async function markNotificationRead(env: Env, notificationId: string, recipient: string): Promise<NotificationRecord | null> {
  const existing = await env.DB.prepare(
    `SELECT id, tenant_id, recipient, type, message, metadata, read_at, created_at
     FROM notifications
     WHERE id = ? AND recipient = ?`
  )
    .bind(notificationId, recipient)
    .first<{
      id: string;
      tenant_id: string | null;
      recipient: string;
      type: string;
      message: string;
      metadata: string | null;
      read_at: string | null;
      created_at: string;
    }>();

  if (!existing) {
    return null;
  }

  const readAt = existing.read_at ?? new Date().toISOString();

  await env.DB.prepare(
    `UPDATE notifications SET read_at = ? WHERE id = ?`
  )
    .bind(readAt, notificationId)
    .run();

  return {
    id: existing.id,
    tenantId: existing.tenant_id,
    recipient: existing.recipient,
    type: existing.type,
    message: existing.message,
    metadata: existing.metadata ? (JSON.parse(existing.metadata) as Record<string, unknown>) : null,
    readAt,
    createdAt: existing.created_at
  };
}
