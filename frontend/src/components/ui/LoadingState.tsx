/**
 * Loading State Components
 * Skeleton loaders for different content types
 */

export function SkeletonText({
  lines = 1,
  className = ""
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`skeleton-group ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === lines - 1 ? "75%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonHeading({ className = "" }: { className?: string }) {
  return <div className={`skeleton skeleton-heading ${className}`} />;
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <div className={`skeleton skeleton-button ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card">
      <div className="card-header">
        <SkeletonHeading />
      </div>
      <div className="card-body">
        <SkeletonText lines={3} />
      </div>
      <div className="card-footer">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="pm-table-wrapper">
      <table className="pm-table">
        <thead>
          <tr>
            <th>
              <SkeletonText />
            </th>
            <th>
              <SkeletonText />
            </th>
            <th>
              <SkeletonText />
            </th>
            <th>
              <SkeletonText />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td>
                <SkeletonText />
              </td>
              <td>
                <SkeletonText lines={2} />
              </td>
              <td>
                <SkeletonText />
              </td>
              <td>
                <SkeletonButton />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPromptList({ count = 3 }: { count?: number }) {
  return (
    <div className="stack-lg">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-start gap-md p-6">
            <div className="flex-1">
              <SkeletonHeading />
              <div className="mt-4">
                <SkeletonText lines={2} />
              </div>
              <div className="flex gap-sm mt-4">
                <div
                  className="skeleton"
                  style={{ width: "60px", height: "24px", borderRadius: "12px" }}
                />
                <div
                  className="skeleton"
                  style={{ width: "80px", height: "24px", borderRadius: "12px" }}
                />
              </div>
            </div>
            <SkeletonButton />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="stack-lg">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6">
            <SkeletonText />
            <SkeletonHeading className="mt-4" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <SkeletonHeading />
        <div className="skeleton mt-6" style={{ height: "200px" }} />
      </div>

      {/* List */}
      <div className="card p-6">
        <SkeletonHeading />
        <div className="stack-md mt-6">
          <SkeletonText lines={5} />
        </div>
      </div>
    </div>
  );
}

// Spinner for quick actions
export function Spinner({
  size = "md",
  className = ""
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={`spinner ${sizes[size]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full page loading overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay__content">
        <Spinner size="lg" />
        <p className="loading-overlay__message">{message}</p>
      </div>
    </div>
  );
}
