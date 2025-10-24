import { useCallback, useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { fetchNotifications, markNotificationRead } from "../lib/api";
import type { NotificationItem } from "../types";

export default function NotificationMenu(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    pollRef.current = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest(".notification-menu")) return;
      setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [open]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification read", error);
    }
  }

  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="notification-menu">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        🔔
        {unread ? <Badge tone="info">{unread}</Badge> : null}
      </Button>
      {open ? (
        <div className="notification-menu__panel">
          <header className="notification-menu__header">
            <h4>Notifications</h4>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => void loadNotifications()}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </header>
          {loading && !notifications.length ? <p className="pm-muted">Loading…</p> : null}
          {notifications.length ? (
            <ul>
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={
                    notification.readAt
                      ? "notification-menu__item"
                      : "notification-menu__item notification-menu__item--unread"
                  }
                >
                  <div>
                    <p className="notification-menu__message">{notification.message}</p>
                    <p className="notification-menu__meta">{formatDate(notification.createdAt)}</p>
                  </div>
                  {!notification.readAt ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => void handleMarkRead(notification.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : !loading ? (
            <p className="pm-muted">No notifications</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
