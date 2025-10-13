import type { PromptAnalyticsEntry } from "../types";
import { Card } from "./ui/Card";
import Field from "./ui/Field";
import Select from "./ui/Select";
import Button from "./ui/Button";

interface AnalyticsPanelProps {
  tenantLabel: string;
  data: PromptAnalyticsEntry[];
  loading: boolean;
  error?: string | null;
  rangeDays: number;
  onRangeChange: (days: number) => void;
  onRefresh: () => void;
}

const RANGE_OPTIONS = [7, 14, 30, 60, 90];

export default function AnalyticsPanel({
  tenantLabel,
  data,
  loading,
  error,
  rangeDays,
  onRangeChange,
  onRefresh
}: AnalyticsPanelProps): JSX.Element {
  return (
    <Card
      title="Usage analytics"
      subtitle={`Tenant: ${tenantLabel}`}
      actions={
        <div className="analytics-controls">
          <Field label="Range (days)" htmlFor="analytics-range">
            <Select
              id="analytics-range"
              value={rangeDays}
              onChange={(event) => onRangeChange(Number(event.target.value))}
              disabled={loading}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      }
      className="analytics-panel"
    >
      {error ? <div className="pm-alert pm-alert--error">{error}</div> : null}

      {loading ? (
        <p className="pm-muted">Loading analytics…</p>
      ) : data.length ? (
        <div className="pm-table-wrapper">
          <table className="pm-table">
            <thead>
              <tr>
                <th>Prompt</th>
                <th>Version</th>
                <th>Usage count</th>
                <th>Last used</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={`${entry.promptId}-${entry.version}`}>
                  <td>{entry.title}</td>
                  <td>v{entry.version}</td>
                  <td>{entry.usageCount}</td>
                  <td>{entry.lastUsed ? new Date(entry.lastUsed).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pm-muted">No usage records found for this range.</p>
      )}
    </Card>
  );
}
