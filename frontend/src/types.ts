import type {
  PromptAnalyticsEntry,
  PromptFilters,
  SortField,
  SortOrder,
  Tenant
} from "@shared/types";

export type {
  Prompt,
  PromptInput,
  PromptUpdateInput,
  PromptVersion,
  PromptAnalyticsEntry,
  PromptListResponse,
  PromptFilters,
  Pagination,
  PromptSearchHighlight,
  PromptSuggestion,
  DashboardMetric,
  DashboardStats,
  UsageTrendPoint,
  TopPromptSummary,
  DashboardOverviewResponse,
  SortField,
  SortOrder,
  Tenant,
  UsageEventPayload,
  TenantCreateInput
} from "@shared/types";

export interface PromptQuery extends PromptFilters {
  tenantId?: string;
  sortBy: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

export interface PromptAnalyticsResponse {
  data: PromptAnalyticsEntry[];
  tenant: Pick<Tenant, "id" | "name" | "slug">;
  rangeDays: number;
}

export interface PromptComment {
  id: string;
  promptId: string;
  tenantId: string;
  parentId: string | null;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
}

export type ShareTargetType = "user" | "email" | "tenant";
export type ShareRole = "viewer" | "editor" | "approver";

export interface PromptShare {
  id: string;
  promptId: string;
  tenantId: string;
  targetType: ShareTargetType;
  targetIdentifier: string;
  role: ShareRole;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

export interface PromptApproval {
  id: string;
  promptId: string;
  tenantId: string;
  requestedBy: string;
  approver: string;
  status: ApprovalStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromptActivityEntry {
  id: string;
  promptId: string;
  tenantId: string;
  actor: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  tenantId: string | null;
  recipient: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
