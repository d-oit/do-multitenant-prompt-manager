import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from "recharts";
import type { DashboardMetric, DashboardOverviewResponse } from "../types";
import { fetchDashboardOverview } from "../lib/api";
import Card from "../components/ui/Card";
import { SkeletonDashboard } from "../components/ui/LoadingState";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

interface DashboardPageProps {
  tenantId: string;
  token?: string;
}

export default function DashboardPage({ tenantId, token }: DashboardPageProps): JSX.Element {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDashboardOverview(tenantId, 14, token || undefined)
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
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
  }, [tenantId, token, reloadKey]);

  const formatMetric = (metric: DashboardMetric) => {
    const delta =
      metric.previous !== undefined && metric.previous !== null
        ? metric.value - metric.previous
        : null;
    const deltaFormatted = delta !== null && delta !== undefined ? `${delta >= 0 ? "+" : ""}${delta}` : null;
    return { value: metric.value, delta: deltaFormatted, positive: delta ? delta >= 0 : true };
  };

  const stats = overview?.stats;

  return (
    <div className="pm-dashboard pm-stack pm-stack--lg">
      {loading ? <SkeletonDashboard /> : null}
      {error ? <ErrorState error={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {!loading && !error && !overview ? (
        <EmptyState
          icon="📊"
          title="No analytics available yet"
          description="Once prompts begin receiving usage, analytics and trends will appear here."
        />
      ) : null}

      {overview ? (
        <>
          <div className="dashboard-header flex items-center justify-between gap-md">
            <div>
              <h2 className="page-title">{overview.tenant.name} overview</h2>
              <p className="pm-muted">Last {overview.rangeDays} days</p>
            </div>
            <Badge tone="info">Tenant: {overview.tenant.slug}</Badge>
          </div>

          {stats ? (
            <div className="grid grid-cols-4 gap-lg dashboard-stats">
              {([
                ["totalPrompts", "Total Prompts"],
                ["usageToday", "Usage Today"],
                ["usageThisWeek", "Usage This Week"],
                ["activePrompts", "Active Prompts"],
                ["recentlyUpdated", "Recently Updated"]
              ] as const)
                .filter(([key]) => stats[key])
                .map(([key, label]) => {
                  const metric = stats[key];
                  const formatted = formatMetric(metric);
                  return (
                    <Card key={key} variant="default" className="dashboard-stat-card">
                      <div className="stat-card">
                        <span className="stat-card__label">{label}</span>
                        <strong className="stat-card__value">{formatted.value}</strong>
                        {formatted.delta ? (
                          <span
                            className={formatted.positive ? "stat-card__delta" : "stat-card__delta stat-card__delta--negative"}
                          >
                            {formatted.delta}
                          </span>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
            </div>
          ) : null}

          <Card title="Usage Trend" subtitle="Daily runs">
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={overview.trend} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string | number) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`${value} runs`, "Usage"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-lg">
            <Card title="Top Prompts" subtitle="Usage by prompt">
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.topPrompts} layout="vertical" margin={{ top: 16, right: 24, bottom: 0, left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="title" width={150} />
                    <Tooltip formatter={(value: number) => [`${value} runs`, "Usage"]} />
                    <Bar dataKey="usageCount" fill="var(--color-accent)" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Recently Updated Prompts">
              <ul className="dashboard-list">
                {overview.topPrompts.slice(0, 5).map((prompt) => (
                  <li key={prompt.promptId} className="dashboard-list__item">
                    <div>
                      <strong>{prompt.title}</strong>
                      <p className="pm-muted">Last used: {prompt.lastUsed ? new Date(prompt.lastUsed).toLocaleString() : "—"}</p>
                    </div>
                    <Badge tone="info">{prompt.usageCount} runs</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
