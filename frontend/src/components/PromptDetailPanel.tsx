import type { Prompt, PromptVersion } from "../types";
import { Card } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Tag from "./ui/Tag";

interface PromptDetailPanelProps {
  prompt: Prompt | null;
  versions: PromptVersion[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onRecordUsage: () => void;
}

export default function PromptDetailPanel({
  prompt,
  versions,
  loading,
  error,
  onRefresh,
  onRecordUsage
}: PromptDetailPanelProps): JSX.Element {
  if (!prompt) {
    return (
      <Card title="Prompt details" className="prompt-detail">
        <p className="pm-muted">Select a prompt to inspect metadata, version history, and usage controls.</p>
      </Card>
    );
  }

  return (
    <Card
      title={prompt.title}
      subtitle={`Version v${prompt.version ?? 1}`}
      actions={
        <div className="prompt-detail__actions">
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh versions"}
          </Button>
          <Button size="sm" onClick={onRecordUsage}>
            Log usage
          </Button>
        </div>
      }
      className="prompt-detail"
    >
      <dl className="prompt-detail__grid">
        <div>
          <dt>Tenant</dt>
          <dd>{prompt.tenantId}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <Badge tone={prompt.archived ? "warning" : "success"}>
              {prompt.archived ? "Archived" : "Active"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Created by</dt>
          <dd>{prompt.createdBy ?? "—"}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{new Date(prompt.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{new Date(prompt.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <section className="prompt-detail__section">
        <h4>Tags</h4>
        <div className="prompt-detail__tags">
          {prompt.tags.length ? prompt.tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <span className="pm-muted">No tags</span>}
        </div>
      </section>

      <section className="prompt-detail__section">
        <h4>Metadata</h4>
        {prompt.metadata ? (
          <pre className="prompt-detail__metadata">{JSON.stringify(prompt.metadata, null, 2)}</pre>
        ) : (
          <span className="pm-muted">No metadata</span>
        )}
      </section>

      <section className="prompt-detail__section">
        <header className="prompt-detail__subheader">
          <h4>Version history</h4>
        </header>
        {error ? <div className="pm-alert pm-alert--error">{error}</div> : null}
        {loading ? (
          <p className="pm-muted">Loading version history…</p>
        ) : versions.length ? (
          <ul className="prompt-detail__versions">
            {versions.map((version) => (
              <li key={`${version.version}-${version.createdAt}`}>
                <div>
                  <strong>v{version.version}</strong>
                  <span className="pm-muted"> · {new Date(version.createdAt).toLocaleString()}</span>
                </div>
                <div className="pm-muted">by {version.createdBy ?? "unknown"}</div>
                {version.metadata ? (
                  <pre className="prompt-detail__metadata-small">{JSON.stringify(version.metadata, null, 2)}</pre>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pm-muted">No historical versions recorded yet.</p>
        )}
      </section>
    </Card>
  );
}
