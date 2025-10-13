import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "../lib/logger";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError("app.fatal", error, { componentStack: info.componentStack });
  }

  private resetBoundary = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fatal-error" role="alert" aria-live="assertive">
          <h1>Something went wrong</h1>
          <p>{this.state.message ?? "Unexpected error encountered."}</p>
          <div className="fatal-actions">
            <button type="button" onClick={this.resetBoundary} className="secondary">
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
