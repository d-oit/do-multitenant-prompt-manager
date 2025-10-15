/**
 * Empty State Component
 * Friendly empty states with actions
 */

import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode | string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function EmptyState({
  icon = "📋",
  title,
  description,
  action,
  secondaryActions
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}

      {action && (
        <button onClick={action.onClick} className="btn btn-primary mt-6" type="button">
          {action.label}
        </button>
      )}

      {secondaryActions && secondaryActions.length > 0 && (
        <div className="empty-state__secondary-actions">
          {secondaryActions.map((secondaryAction, index) => (
            <button
              key={index}
              onClick={secondaryAction.onClick}
              className="empty-state__secondary-action"
              type="button"
            >
              {secondaryAction.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Preset empty states
export function NoPromptsFound({ onCreatePrompt }: { onCreatePrompt: () => void }) {
  return (
    <EmptyState
      icon="🎯"
      title="No prompts found"
      description="Get started by creating your first prompt!"
      action={{
        label: "+ Create Your First Prompt",
        onClick: onCreatePrompt
      }}
      secondaryActions={[
        {
          label: "Import from template",
          onClick: () => undefined
        },
        {
          label: "Browse examples",
          onClick: () => undefined
        }
      ]}
    />
  );
}

export function NoSearchResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description="Try adjusting your search or filters"
      action={{
        label: "Clear Filters",
        onClick: onClearFilters
      }}
    />
  );
}

export function NoTenants({ onCreateTenant }: { onCreateTenant: () => void }) {
  return (
    <EmptyState
      icon="🏢"
      title="No tenants yet"
      description="Create your first tenant to start managing prompts"
      action={{
        label: "+ Create Tenant",
        onClick: onCreateTenant
      }}
    />
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={error}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry
            }
          : undefined
      }
    />
  );
}
