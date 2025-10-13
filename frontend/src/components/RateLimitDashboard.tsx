import { useEffect, useState } from "react";
import { Card } from "./ui/Card";
import Button from "./ui/Button";

interface RateLimitInfo {
  endpoint: string;
  limit: number;
  remaining: number;
  reset: number;
  percentage: number;
}

interface RateLimitDashboardProps {
  token?: string;
}

export function RateLimitDashboard({ token }: RateLimitDashboardProps): JSX.Element {
  const [limits, setLimits] = useState<RateLimitInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRateLimits = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch from multiple endpoints to get rate limit info
      const endpoints = [
        '/prompts',
        '/analytics/overview',
        '/tenants'
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0', 10);
            const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10);
            const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10);

            if (limit > 0) {
              return {
                endpoint,
                limit,
                remaining,
                reset,
                percentage: (remaining / limit) * 100
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      setLimits(results.filter((r): r is RateLimitInfo => r !== null));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRateLimits();
    const interval = setInterval(() => {
      void fetchRateLimits();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const formatResetTime = (reset: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const seconds = reset - now;
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage > 50) return 'var(--pm-color-success)';
    if (percentage > 20) return 'var(--pm-color-warning)';
    return 'var(--pm-color-error)';
  };

  if (!token) {
    return (
      <Card>
        <div className="pm-card__header">
          <h3>Rate Limit Monitor</h3>
        </div>
        <div className="pm-card__content">
          <p className="pm-text-muted">Please provide an access token to monitor rate limits.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="pm-card__header">
        <h3>Rate Limit Monitor</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void fetchRateLimits()}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <div className="pm-card__content">
        {limits.length === 0 ? (
          <p className="pm-text-muted">No rate limit information available</p>
        ) : (
          <div className="rate-limit-dashboard">
            {limits.map((limit) => (
              <div key={limit.endpoint} className="rate-limit-item">
                <div className="rate-limit-item__header">
                  <span className="rate-limit-item__endpoint">{limit.endpoint}</span>
                  <span className="rate-limit-item__count">
                    {limit.remaining} / {limit.limit}
                  </span>
                </div>
                <div className="rate-limit-item__bar">
                  <div
                    className="rate-limit-item__bar-fill"
                    style={{
                      width: `${limit.percentage}%`,
                      backgroundColor: getStatusColor(limit.percentage)
                    }}
                  />
                </div>
                <div className="rate-limit-item__footer">
                  <span className="pm-text-muted pm-text-xs">
                    Resets in {formatResetTime(limit.reset)}
                  </span>
                  <span
                    className="pm-text-xs"
                    style={{ color: getStatusColor(limit.percentage) }}
                  >
                    {limit.percentage.toFixed(0)}% remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default RateLimitDashboard;
