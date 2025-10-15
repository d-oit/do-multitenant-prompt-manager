import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Prompt,
  PromptVersion,
  PromptComment,
  PromptShare,
  PromptApproval,
  PromptActivityEntry
} from "../types";
import {
  fetchPromptVersions,
  recordPromptUsage,
  fetchPromptComments,
  createPromptComment,
  updatePromptComment,
  deletePromptComment,
  fetchPromptShares,
  createPromptShare,
  removePromptShare,
  fetchPromptApprovals,
  requestPromptApproval,
  updatePromptApproval,
  fetchPromptActivity
} from "../lib/api";
import PromptDetailPanel from "./PromptDetailPanel";
import { Card } from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Textarea from "./ui/Textarea";
import Badge from "./ui/Badge";

interface PromptCollaborationPanelProps {
  prompt: Prompt;
  tenantId: string;
  token: string;
  toast: {
    success: (message: string) => string;
    error: (message: string) => string;
    info: (message: string) => string;
    warning: (message: string) => string;
  };
}

type TabKey = "overview" | "comments" | "shares" | "approvals" | "activity";

interface CommentNode extends PromptComment {
  depth: number;
  children: CommentNode[];
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Sharing" },
  { key: "approvals", label: "Approvals" },
  { key: "activity", label: "Activity" }
];

export default function PromptCollaborationPanel({
  prompt,
  tenantId,
  token,
  toast
}: PromptCollaborationPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  const [comments, setComments] = useState<PromptComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentParentId, setCommentParentId] = useState<string | null>(null);

  const [shares, setShares] = useState<PromptShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [shareTargetType, setShareTargetType] = useState("user");
  const [shareIdentifier, setShareIdentifier] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [shareExpiry, setShareExpiry] = useState<string>("");

  const [approvals, setApprovals] = useState<PromptApproval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");

  const [activity, setActivity] = useState<PromptActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const { success: showSuccess, error: showError, info: showInfo } = toast;

  useEffect(() => {
    setActiveTab("overview");
    setVersions([]);
    setComments([]);
    setShares([]);
    setApprovals([]);
    setActivity([]);
    setCommentDraft("");
    setCommentParentId(null);
    setShareIdentifier("");
    setApprovalTarget("");
    setApprovalMessage("");
  }, [prompt.id]);

  const refreshVersions = useCallback(async () => {
    try {
      setVersionsLoading(true);
      setVersionsError(null);
      const next = await fetchPromptVersions(prompt.id, tenantId, 20, token || undefined);
      setVersions(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setVersionsError(message);
      showError(`Failed to load versions: ${message}`);
    } finally {
      setVersionsLoading(false);
    }
  }, [prompt.id, tenantId, token, showError]);

  useEffect(() => {
    void refreshVersions();
  }, [refreshVersions]);

  const refreshComments = useCallback(
    async (notify = false) => {
      try {
        setCommentsLoading(true);
        const next = await fetchPromptComments(prompt.id, tenantId, token || undefined);
        setComments(next);
        if (notify) showSuccess("Comments updated");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showError(`Unable to load comments: ${message}`);
      } finally {
        setCommentsLoading(false);
      }
    },
    [prompt.id, tenantId, token, showError, showSuccess]
  );

  const refreshShares = useCallback(
    async (notify = false) => {
      try {
        setSharesLoading(true);
        const next = await fetchPromptShares(prompt.id, tenantId, token || undefined);
        setShares(next);
        if (notify) showSuccess("Shares updated");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showError(`Unable to load shares: ${message}`);
      } finally {
        setSharesLoading(false);
      }
    },
    [prompt.id, tenantId, token, showError, showSuccess]
  );

  const refreshApprovals = useCallback(
    async (notify = false) => {
      try {
        setApprovalsLoading(true);
        const next = await fetchPromptApprovals(prompt.id, tenantId, token || undefined);
        setApprovals(next);
        if (notify) showSuccess("Approvals updated");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showError(`Unable to load approvals: ${message}`);
      } finally {
        setApprovalsLoading(false);
      }
    },
    [prompt.id, tenantId, token, showError, showSuccess]
  );

  const refreshActivity = useCallback(
    async (notify = false) => {
      try {
        setActivityLoading(true);
        const next = await fetchPromptActivity(prompt.id, tenantId, token || undefined);
        setActivity(next);
        if (notify) showSuccess("Activity updated");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showError(`Unable to load activity: ${message}`);
      } finally {
        setActivityLoading(false);
      }
    },
    [prompt.id, tenantId, token, showError, showSuccess]
  );

  useEffect(() => {
    if (activeTab === "comments" && !commentsLoading && comments.length === 0) {
      void refreshComments();
    } else if (activeTab === "shares" && !sharesLoading && shares.length === 0) {
      void refreshShares();
    } else if (activeTab === "approvals" && !approvalsLoading && approvals.length === 0) {
      void refreshApprovals();
    } else if (activeTab === "activity" && !activityLoading && activity.length === 0) {
      void refreshActivity();
    }
  }, [
    activeTab,
    commentsLoading,
    comments.length,
    refreshComments,
    sharesLoading,
    shares.length,
    refreshShares,
    approvalsLoading,
    approvals.length,
    refreshApprovals,
    activityLoading,
    activity.length,
    refreshActivity
  ]);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  async function handleRecordUsage() {
    try {
      await recordPromptUsage(prompt.id, tenantId, {}, token || undefined);
      showSuccess("Usage recorded");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Failed to log usage: ${message}`);
    }
  }

  async function handleSubmitComment() {
    if (!commentDraft.trim()) {
      showInfo("Add a comment before submitting");
      return;
    }
    try {
      await createPromptComment(
        prompt.id,
        tenantId,
        {
          body: commentDraft.trim(),
          parentId: commentParentId ?? undefined
        },
        token || undefined
      );
      setCommentDraft("");
      setCommentParentId(null);
      await refreshComments(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Unable to add comment: ${message}`);
    }
  }

  async function handleToggleResolved(comment: PromptComment) {
    try {
      await updatePromptComment(
        comment.id,
        tenantId,
        { resolved: !comment.resolved },
        token || undefined
      );
      await refreshComments();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Unable to update comment: ${message}`);
    }
  }

  async function handleDeleteComment(comment: PromptComment) {
    try {
      await deletePromptComment(comment.id, tenantId, token || undefined);
      await refreshComments(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Unable to delete comment: ${message}`);
    }
  }

  async function handleCreateShare() {
    if (!shareIdentifier.trim()) {
      showInfo("Provide a share target");
      return;
    }
    try {
      await createPromptShare(
        prompt.id,
        tenantId,
        {
          targetType: shareTargetType as PromptShare["targetType"],
          targetIdentifier: shareIdentifier.trim(),
          role: shareRole as PromptShare["role"],
          expiresAt: shareExpiry ? new Date(shareExpiry).toISOString() : null
        },
        token || undefined
      );
      setShareIdentifier("");
      setShareExpiry("");
      await refreshShares(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Unable to create share: ${message}`);
    }
  }

  async function handleRemoveShare(share: PromptShare) {
    try {
      await removePromptShare(prompt.id, share.id, tenantId, token || undefined);
      await refreshShares();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Unable to remove share: ${message}`);
    }
  }

  async function handleRequestApproval() {
    if (!approvalTarget.trim()) {
      showInfo("Select an approver");
      return;
    }
    try {
      await requestPromptApproval(
        prompt.id,
        tenantId,
        { approver: approvalTarget.trim(), message: approvalMessage.trim() || undefined },
        token || undefined
      );
      setApprovalTarget("");
      setApprovalMessage("");
      await refreshApprovals(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`Unable to request approval: ${message}`);
    }
  }

  async function handleUpdateApproval(
    approval: PromptApproval,
    status: PromptApproval["status"],
    message?: string
  ) {
    try {
      await updatePromptApproval(
        approval.id,
        tenantId,
        {
          status,
          message
        },
        token || undefined
      );
      await refreshApprovals();
      await refreshActivity();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      showError(`Unable to update approval: ${reason}`);
    }
  }

  return (
    <div className="prompt-collaboration-panel">
      <nav className="prompt-collaboration-panel__tabs" aria-label="Prompt collaboration sections">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tabButtonClass(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="prompt-collaboration-panel__content" data-tab={activeTab}>
        {activeTab === "overview" ? (
          <PromptDetailPanel
            prompt={prompt}
            versions={versions}
            loading={versionsLoading}
            error={versionsError}
            onRefresh={() => void refreshVersions()}
            onRecordUsage={() => void handleRecordUsage()}
          />
        ) : null}

        {activeTab === "comments" ? (
          <Card title="Threaded comments" className="prompt-collaboration-panel__card">
            <div className="prompt-comments__composer">
              {commentParentId ? (
                <div className="prompt-comments__replying">
                  Replying to comment
                  <Button variant="ghost" size="xs" onClick={() => setCommentParentId(null)}>
                    Cancel reply
                  </Button>
                </div>
              ) : null}
              <Textarea
                placeholder="Share feedback or ask a question"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                rows={4}
              />
              <div className="prompt-comments__actions">
                <Button
                  size="sm"
                  onClick={() => void handleSubmitComment()}
                  disabled={commentsLoading}
                >
                  {commentsLoading ? "Posting…" : "Post comment"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void refreshComments(true)}
                  disabled={commentsLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {commentsLoading && comments.length === 0 ? (
              <p className="pm-muted">Loading comments…</p>
            ) : commentTree.length ? (
              <ul className="prompt-comments__list">
                {commentTree.map((node) => (
                  <CommentItem
                    key={node.id}
                    node={node}
                    onReply={(comment) => {
                      setCommentParentId(comment.id);
                      setActiveTab("comments");
                    }}
                    onResolveToggle={handleToggleResolved}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </ul>
            ) : (
              <p className="pm-muted">No comments yet. Start the conversation above.</p>
            )}
          </Card>
        ) : null}

        {activeTab === "shares" ? (
          <Card title="Sharing" className="prompt-collaboration-panel__card">
            <div className="prompt-share__form">
              <Select
                value={shareTargetType}
                onChange={(event) => setShareTargetType(event.target.value)}
              >
                <option value="user">User ID</option>
                <option value="email">Email</option>
                <option value="tenant">Tenant</option>
              </Select>
              <Input
                value={shareIdentifier}
                placeholder="user@example.com"
                onChange={(event) => setShareIdentifier(event.target.value)}
              />
              <Select value={shareRole} onChange={(event) => setShareRole(event.target.value)}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="approver">Approver</option>
              </Select>
              <Input
                type="date"
                value={shareExpiry}
                onChange={(event) => setShareExpiry(event.target.value)}
                aria-label="Expiration date"
              />
              <Button size="sm" onClick={() => void handleCreateShare()} disabled={sharesLoading}>
                {sharesLoading ? "Saving…" : "Share"}
              </Button>
            </div>

            {sharesLoading && shares.length === 0 ? (
              <p className="pm-muted">Loading shares…</p>
            ) : shares.length ? (
              <ul className="prompt-share__list">
                {shares.map((share) => (
                  <li key={share.id} className="prompt-share__item">
                    <div>
                      <strong>{share.targetIdentifier}</strong>
                      <span className="pm-muted"> · {share.targetType}</span>
                      <span className="pm-muted"> · {share.role}</span>
                      {share.expiresAt ? (
                        <span className="pm-muted"> · Expires {formatDate(share.expiresAt)}</span>
                      ) : null}
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => void handleRemoveShare(share)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pm-muted">No shares yet.</p>
            )}
          </Card>
        ) : null}

        {activeTab === "approvals" ? (
          <Card title="Approvals" className="prompt-collaboration-panel__card">
            <div className="prompt-approvals__form">
              <Input
                value={approvalTarget}
                onChange={(event) => setApprovalTarget(event.target.value)}
                placeholder="Approver email or ID"
                aria-label="Approver"
              />
              <Textarea
                value={approvalMessage}
                onChange={(event) => setApprovalMessage(event.target.value)}
                placeholder="Optional message"
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => void handleRequestApproval()}
                disabled={approvalsLoading}
              >
                {approvalsLoading ? "Requesting…" : "Request approval"}
              </Button>
            </div>

            {approvalsLoading && approvals.length === 0 ? (
              <p className="pm-muted">Loading approvals…</p>
            ) : approvals.length ? (
              <ul className="prompt-approvals__list">
                {approvals.map((approval) => (
                  <li key={approval.id} className="prompt-approvals__item">
                    <div>
                      <div className="prompt-approvals__header">
                        <span>
                          Requested by <strong>{approval.requestedBy}</strong> · Approver{" "}
                          {approval.approver}
                        </span>
                        <Badge
                          tone={
                            approval.status === "approved"
                              ? "success"
                              : approval.status === "rejected"
                                ? "danger"
                                : "info"
                          }
                        >
                          {approval.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="pm-muted">
                        Requested {formatDate(approval.createdAt)} · Updated{" "}
                        {formatDate(approval.updatedAt)}
                      </div>
                      {approval.message ? (
                        <p className="prompt-approvals__message">{approval.message}</p>
                      ) : null}
                    </div>
                    <div className="prompt-approvals__actions">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => void handleUpdateApproval(approval, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => void handleUpdateApproval(approval, "changes_requested")}
                      >
                        Request changes
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => void handleUpdateApproval(approval, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pm-muted">No approval requests yet.</p>
            )}
          </Card>
        ) : null}

        {activeTab === "activity" ? (
          <Card title="Recent activity" className="prompt-collaboration-panel__card">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refreshActivity(true)}
              disabled={activityLoading}
            >
              {activityLoading ? "Refreshing…" : "Refresh"}
            </Button>
            {activityLoading && activity.length === 0 ? (
              <p className="pm-muted">Loading activity…</p>
            ) : activity.length ? (
              <ul className="prompt-activity__list">
                {activity.map((entry) => (
                  <li key={entry.id}>
                    <div>
                      <strong>{entry.action}</strong>
                      <span className="pm-muted"> · {formatDate(entry.createdAt)}</span>
                    </div>
                    <div className="pm-muted">{entry.actor ?? "system"}</div>
                    {entry.metadata ? (
                      <pre className="prompt-activity__metadata">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pm-muted">No recorded activity yet.</p>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function buildCommentTree(comments: PromptComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, depth: 0, children: [] });
  });

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (list: CommentNode[]) => {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    list.forEach((child) => sortNodes(child.children));
  };
  sortNodes(roots);

  return roots;
}

interface CommentItemProps {
  node: CommentNode;
  onReply: (comment: PromptComment) => void;
  onResolveToggle: (comment: PromptComment) => void;
  onDelete: (comment: PromptComment) => void;
}

function CommentItem({ node, onReply, onResolveToggle, onDelete }: CommentItemProps): JSX.Element {
  return (
    <li className="prompt-comments__item" style={{ marginLeft: node.depth * 16 }}>
      <div className="prompt-comments__meta">
        <strong>{node.createdBy}</strong>
        <span className="pm-muted"> · {formatDate(node.createdAt)}</span>
        {node.resolved ? <Badge tone="success">Resolved</Badge> : null}
      </div>
      <p>{node.body}</p>
      <div className="prompt-comments__controls">
        <Button variant="ghost" size="xs" onClick={() => onReply(node)}>
          Reply
        </Button>
        <Button variant="ghost" size="xs" onClick={() => onResolveToggle(node)}>
          {node.resolved ? "Reopen" : "Resolve"}
        </Button>
        <Button variant="ghost" size="xs" onClick={() => onDelete(node)}>
          Delete
        </Button>
      </div>
      {node.children.length ? (
        <ul className="prompt-comments__list" aria-label="Replies">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              onReply={onReply}
              onResolveToggle={onResolveToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function tabButtonClass(active: boolean): string {
  return active
    ? "prompt-collaboration-panel__tab prompt-collaboration-panel__tab--active"
    : "prompt-collaboration-panel__tab";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
