import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from "recharts";
import type { PromptAnalyticsEntry, PromptAnalyticsResponse } from "../types";
import { fetchPromptAnalytics } from "../lib/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { SkeletonTable } from "../components/ui/LoadingState";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

interface AnalyticsPageProps {
  tenantId: string;
  token?: string;
}

const ranges = [7, 14, 30];

export default function AnalyticsPage({ tenantId, token }: AnalyticsPageProps): JSX.Element {
  const [analytics, setAnalytics] = useState<PromptAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(30);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPromptAnalytics(tenantId, range, token || undefined)
      .then((response) => {
        if (cancelled) return;
        setAnalytics(response);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId, range, token, reloadKey]);

  const maxUsage = useMemo(() => {
    if (!analytics) return 0;
    return analytics.data.reduce((max, entry) => Math.max(max, entry.usageCount), 0);
  }, [analytics]);

  return (
    <div className="pm-analytics-page pm-stack pm-stack--lg">
      <div className="flex items-center justify-between gap-md">
        <div>
          <h2 className="page-title">Prompt Analytics</h2>
          <p className="pm-muted">Usage insights for tenant {tenantId}</p>
        </div>
        <div className="flex items-center gap-sm">
          {ranges.map((value) => (
            <Button
              key={value}
              variant={value === range ? "primary" : "ghost"}
              size="sm"
              onClick={() => setRange(value)}
            >
              Last {value} days
            </Button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonTable rows={6} /> : null}
      {error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}

      {!loading && !error && (!analytics || analytics.data.length === 0) ? (
        <EmptyState
          icon="📉"
          title="No analytics yet"
          description="Run prompts to start generating analytics data."
        />
      ) : null}

      {analytics ? (
        <>
          <Card title="Usage Distribution" subtitle={`Top ${analytics.data.length} prompts`}>
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.data.slice(0, 10)}
                  margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [`${value} runs`, "Usage"]} />
                  <Bar dataKey="usageCount" fill="var(--color-accent)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Usage Momentum" subtitle="Cumulative engagement">
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={analytics.data}
                  margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" hide />
                  <YAxis allowDecimals={false} domain={[0, Math.max(1, maxUsage)]} />
                  <Tooltip
                    formatter={(value: number, _name, entry) => [
                      `${value} runs`,
                      entry.payload.title
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="usageCount"
                    stroke="var(--color-accent)"
                    fillOpacity={1}
                    fill="url(#usageGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Prompt Performance">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Prompt</th>
                  <th>Version</th>
                  <th>Usage</th>
                  <th>Last Used</th>
                </tr>
              </thead>
              <tbody>
                {analytics.data.map((entry: PromptAnalyticsEntry) => (
                  <tr key={entry.promptId}>
                    <td>
                      <div className="pm-stack pm-stack--sm">
                        <strong>{entry.title}</strong>
                        <span className="pm-muted">ID: {entry.promptId}</span>
                      </div>
                    </td>
                    <td>v{entry.version}</td>
                    <td>
                      <Badge tone="info">{entry.usageCount} runs</Badge>
                    </td>
                    <td>{entry.lastUsed ? new Date(entry.lastUsed).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}
    </div>
  );
}
