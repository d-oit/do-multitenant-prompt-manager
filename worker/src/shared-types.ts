export type SortField = "created_at" | "updated_at" | "title";
export type SortOrder = "asc" | "desc";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Prompt {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  archived: boolean;
  createdBy: string | null;
}

export interface PromptInput {
  tenantId: string;
  title: string;
  body: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  archived?: boolean;
  createdBy?: string;
}

export interface PromptUpdateInput {
  tenantId?: string;
  title?: string;
  body?: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  archived?: boolean;
  createdBy?: string;
}

export interface PromptFilters {
  search?: string;
  tag?: string;
  metadataKey?: string;
  metadataValue?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PromptSearchHighlight {
  promptId: string;
  title?: string | null;
  body?: string | null;
  tags?: string | null;
  metadata?: string | null;
  relevance?: number;
}

export interface PromptListResponse {
  data: Prompt[];
  pagination: Pagination;
  sort: SortField;
  order: SortOrder;
  filters: PromptFilters;
  highlights?: PromptSearchHighlight[];
}

export interface PromptVersion {
  version: number;
  title: string;
  body: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
}

export interface UsageEventPayload {
  metadata?: Record<string, unknown>;
}

export interface PromptAnalyticsEntry {
  promptId: string;
  title: string;
  version: number;
  usageCount: number;
  lastUsed: string | null;
}

export interface TenantCreateInput {
  name: string;
  slug: string;
  createdBy?: string;
}

export interface PromptSuggestion {
  id: string;
  title: string;
  tenantId: string;
  highlight?: string | null;
}

export interface DashboardMetric {
  value: number;
  previous?: number;
}

export interface DashboardStats {
  totalPrompts: DashboardMetric;
  usageToday: DashboardMetric;
  usageThisWeek: DashboardMetric;
  activePrompts: DashboardMetric;
  recentlyUpdated: DashboardMetric;
}

export interface UsageTrendPoint {
  date: string;
  count: number;
}

export interface TopPromptSummary {
  promptId: string;
  title: string;
  version: number;
  usageCount: number;
  lastUsed: string | null;
}

export interface DashboardOverviewResponse {
  tenant: Pick<Tenant, "id" | "name" | "slug">;
  rangeDays: number;
  stats: DashboardStats;
  trend: UsageTrendPoint[];
  topPrompts: TopPromptSummary[];
}
