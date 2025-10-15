import type { ReactNode } from "react";
import type { Prompt, SortField } from "../types";
import { Card } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Tag from "./ui/Tag";
import { cn } from "../design-system/utils";

interface PromptTableProps {
  prompts: Prompt[];
  loading: boolean;
  sortBy: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onView: (prompt: Prompt) => void;
  deletingId: string | null;
}

export default function PromptTable({
  prompts,
  loading,
  sortBy,
  order,
  onSort,
  onEdit,
  onDelete,
  onView,
  deletingId
}: PromptTableProps): JSX.Element {
  return (
    <Card
      title="Prompts"
      actions={loading ? <Badge tone="info">Loading…</Badge> : undefined}
      className="prompt-table"
    >
      <div className="pm-table-wrapper">
        <table className="pm-table">
          <thead>
            <tr>
              <th>
                <SortButton field="title" activeField={sortBy} order={order} onSort={onSort}>
                  Title
                </SortButton>
              </th>
              <th>Body</th>
              <th>Tags</th>
              <th>Version</th>
              <th>Created by</th>
              <th>
                <SortButton field="created_at" activeField={sortBy} order={order} onSort={onSort}>
                  Created
                </SortButton>
              </th>
              <th>
                <SortButton field="updated_at" activeField={sortBy} order={order} onSort={onSort}>
                  Updated
                </SortButton>
              </th>
              <th>Metadata</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !prompts.length ? (
              <tr>
                <td colSpan={10} className="pm-muted">
                  Loading prompts…
                </td>
              </tr>
            ) : prompts.length ? (
              prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td data-label="Title">
                    <div className="prompt-table__title">
                      <strong>{prompt.title}</strong>
                    </div>
                  </td>
                  <td data-label="Body">
                    <details className="prompt-table__details">
                      <summary>Preview</summary>
                      <pre>{prompt.body}</pre>
                    </details>
                  </td>
                  <td data-label="Tags">
                    <div className="prompt-table__tags">
                      {prompt.tags.length ? (
                        prompt.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                      ) : (
                        <span className="pm-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Version">v{prompt.version ?? 1}</td>
                  <td data-label="Created by">
                    {prompt.createdBy ? (
                      <span>{prompt.createdBy}</span>
                    ) : (
                      <span className="pm-muted">—</span>
                    )}
                  </td>
                  <td data-label="Created">{formatDate(prompt.createdAt)}</td>
                  <td data-label="Updated">{formatDate(prompt.updatedAt)}</td>
                  <td data-label="Metadata">
                    {prompt.metadata ? (
                      <pre className="prompt-table__metadata">
                        {JSON.stringify(prompt.metadata, null, 2)}
                      </pre>
                    ) : (
                      <span className="pm-muted">—</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <Badge tone={prompt.archived ? "warning" : "success"}>
                      {prompt.archived ? "Archived" : "Active"}
                    </Badge>
                  </td>
                  <td data-label="Actions" className="prompt-table__actions">
                    <Button variant="ghost" size="sm" onClick={() => onView(prompt)}>
                      View
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onEdit(prompt)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(prompt)}
                      disabled={deletingId === prompt.id}
                    >
                      {deletingId === prompt.id ? "Removing…" : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="pm-muted">
                  No prompts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface SortButtonProps {
  field: SortField;
  activeField: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: ReactNode;
}

function SortButton({ field, activeField, order, onSort, children }: SortButtonProps): JSX.Element {
  const active = field === activeField;
  const indicator = active ? (order === "asc" ? "↑" : "↓") : "↕";
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("prompt-table__sort", active && "prompt-table__sort--active")}
      onClick={() => onSort(field)}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="prompt-table__sort-indicator">
        {indicator}
      </span>
    </Button>
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
