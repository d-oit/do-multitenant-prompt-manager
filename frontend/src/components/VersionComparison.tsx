import { useState } from "react";
import type { Prompt } from "../types";

interface VersionComparisonProps {
  versions: Prompt[];
  currentVersionId: string;
  onRestore?: (versionId: string) => void;
  onClose?: () => void;
}

interface Change {
  type: "added" | "removed" | "modified";
  field: string;
  oldValue?: string;
  newValue?: string;
}

export function VersionComparison({
  versions,
  currentVersionId,
  onRestore,
  onClose
}: VersionComparisonProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions.length > 1 ? versions[1].id : versions[0].id
  );

  const currentVersion = versions.find((v) => v.id === currentVersionId);
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  if (!currentVersion || !selectedVersion) {
    return <div>Version not found</div>;
  }

  const changes = compareVersions(currentVersion, selectedVersion);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="version-comparison">
      <div className="version-comparison__header">
        <h2>Compare Versions</h2>
        {onClose && (
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="version-comparison__selectors">
        <div className="version-comparison__selector">
          <div className="version-comparison__selector-label">Current Version</div>
          <div className="version-comparison__version-info">
            <strong>v{versions.indexOf(currentVersion) + 1}</strong>
            <span>{formatDate(currentVersion.updatedAt)}</span>
          </div>
        </div>

        <div className="version-comparison__arrow">↔</div>

        <div className="version-comparison__selector">
          <label htmlFor="compare-version-select">Compare With</label>
          <select
            id="compare-version-select"
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            className="input"
          >
            {versions.map((version, idx) => (
              <option
                key={version.id}
                value={version.id}
                disabled={version.id === currentVersionId}
              >
                v{idx + 1} - {formatDate(version.updatedAt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="version-comparison__content">
        <div className="version-comparison__side">
          <h3>Current (v{versions.indexOf(currentVersion) + 1})</h3>
          <div className="version-comparison__field">
            <div className="version-comparison__field-label">Title</div>
            <div className="version-comparison__value">{currentVersion.title}</div>
          </div>
          <div className="version-comparison__field">
            <div className="version-comparison__field-label">Body</div>
            <div className="version-comparison__value version-comparison__body">
              {currentVersion.body}
            </div>
          </div>
          <div className="version-comparison__field">
            <div className="version-comparison__field-label">Tags</div>
            <div className="version-comparison__tags">
              {(currentVersion.tags || []).map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="version-comparison__side">
          <h3>
            Previous (v{versions.indexOf(selectedVersion) + 1})
            {onRestore && (
              <button
                onClick={() => onRestore(selectedVersionId)}
                className="btn btn-secondary btn-sm"
              >
                Restore
              </button>
            )}
          </h3>
          <div className="version-comparison__field">
            <div className="version-comparison__field-label">Title</div>
            <div className="version-comparison__value">{selectedVersion.title}</div>
          </div>
          <div className="version-comparison__field">
            <div className="version-comparison__field-label">Body</div>
            <div className="version-comparison__value version-comparison__body">
              {selectedVersion.body}
            </div>
          </div>
          <div className="version-comparison__field">
            <div className="version-comparison__field-label">Tags</div>
            <div className="version-comparison__tags">
              {(selectedVersion.tags || []).map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="version-comparison__changes">
        <h3>Changes Summary</h3>
        {changes.length === 0 ? (
          <p className="version-comparison__no-changes">No changes detected</p>
        ) : (
          <ul className="version-comparison__changes-list">
            {changes.map((change, idx) => (
              <li
                key={idx}
                className={`version-comparison__change version-comparison__change--${change.type}`}
              >
                <span className="version-comparison__change-icon">
                  {change.type === "added" && "+"}
                  {change.type === "removed" && "-"}
                  {change.type === "modified" && "~"}
                </span>
                <span className="version-comparison__change-text">{formatChange(change)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function compareVersions(current: Prompt, previous: Prompt): Change[] {
  const changes: Change[] = [];

  // Compare title
  if (current.title !== previous.title) {
    changes.push({
      type: "modified",
      field: "title",
      oldValue: previous.title,
      newValue: current.title
    });
  }

  // Compare body
  if (current.body !== previous.body) {
    changes.push({
      type: "modified",
      field: "body",
      oldValue: previous.body.slice(0, 50) + "...",
      newValue: current.body.slice(0, 50) + "..."
    });
  }

  // Compare tags
  const currentTags = new Set(current.tags || []);
  const previousTags = new Set(previous.tags || []);

  previousTags.forEach((tag) => {
    if (!currentTags.has(tag)) {
      changes.push({
        type: "removed",
        field: "tag",
        oldValue: tag
      });
    }
  });

  currentTags.forEach((tag) => {
    if (!previousTags.has(tag)) {
      changes.push({
        type: "added",
        field: "tag",
        newValue: tag
      });
    }
  });

  // Compare metadata
  const currentMetadata = current.metadata || {};
  const previousMetadata = previous.metadata || {};

  Object.keys(previousMetadata).forEach((key) => {
    if (!(key in currentMetadata)) {
      changes.push({
        type: "removed",
        field: `metadata.${key}`,
        oldValue: String(previousMetadata[key])
      });
    } else if (currentMetadata[key] !== previousMetadata[key]) {
      changes.push({
        type: "modified",
        field: `metadata.${key}`,
        oldValue: String(previousMetadata[key]),
        newValue: String(currentMetadata[key])
      });
    }
  });

  Object.keys(currentMetadata).forEach((key) => {
    if (!(key in previousMetadata)) {
      changes.push({
        type: "added",
        field: `metadata.${key}`,
        newValue: String(currentMetadata[key])
      });
    }
  });

  return changes;
}

function formatChange(change: Change): string {
  switch (change.type) {
    case "added":
      return `Added ${change.field}: ${change.newValue}`;
    case "removed":
      return `Removed ${change.field}: ${change.oldValue}`;
    case "modified":
      return `Changed ${change.field}: ${change.oldValue} → ${change.newValue}`;
    default:
      return "";
  }
}
