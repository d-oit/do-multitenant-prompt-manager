import type {
  Prompt,
  PromptAnalyticsResponse,
  PromptInput,
  PromptListResponse,
  PromptQuery,
  PromptSuggestion,
  PromptUpdateInput,
  PromptVersion,
  Tenant,
  TenantCreateInput,
  UsageEventPayload,
  DashboardOverviewResponse,
  PromptComment,
  PromptShare,
  ShareTargetType,
  ShareRole,
  PromptApproval,
  ApprovalStatus,
  PromptActivityEntry,
  NotificationItem
} from "../types";

const resolvedBaseUrl = resolveBaseUrl();
export const API_BASE_URL = resolvedBaseUrl;

function buildQuery(params: PromptQuery): string {
  const search = new URLSearchParams();
  if (params.tenantId) search.set("tenantId", params.tenantId);
  if (params.search) search.set("search", params.search);
  if (params.tag) search.set("tag", params.tag);
  if (params.metadataKey) search.set("metadataKey", params.metadataKey);
  if (params.metadataValue) search.set("metadataValue", params.metadataValue);
  search.set("sortBy", params.sortBy);
  search.set("order", params.order);
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  return search.toString();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    });
  } catch (error) {
    throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }

  const bodyText = await response.text();
  const body = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    const message = body?.error || response.statusText || "Request failed";
    const err = new Error(message);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return body as T;
}

export async function listPrompts(
  params: PromptQuery,
  token?: string
): Promise<PromptListResponse> {
  const query = buildQuery(params);
  const headers: HeadersInit = {};
  if (params.tenantId) {
    headers["X-Tenant-Id"] = params.tenantId;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request<PromptListResponse>(`/prompts?${query}`, { headers });
}

export async function createPrompt(input: PromptInput, token?: string): Promise<Prompt> {
  const headers: HeadersInit = {
    "X-Tenant-Id": input.tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request<{ data: Prompt }>(`/prompts`, {
    method: "POST",
    body: JSON.stringify(input),
    headers
  });
  return response.data;
}

export async function updatePrompt(
  id: string,
  input: PromptUpdateInput,
  tenantId: string,
  token?: string
): Promise<Prompt> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request<{ data: Prompt }>(`/prompts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    headers
  });
  return response.data;
}

export async function deletePrompt(id: string, tenantId: string, token?: string): Promise<void> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  await request(`/prompts/${id}`, {
    method: "DELETE",
    headers
  });
}

export async function listTenants(token?: string): Promise<Tenant[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request<{ data: Tenant[] }>("/tenants", { headers });
  return response.data;
}

export async function createTenant(input: TenantCreateInput, token?: string): Promise<Tenant> {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request<{ data: Tenant }>("/tenants", {
    method: "POST",
    body: JSON.stringify(input),
    headers
  });
  return response.data;
}

export async function fetchPromptVersions(
  promptId: string,
  tenantId: string,
  limit = 20,
  token?: string
): Promise<PromptVersion[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request<{ data: PromptVersion[] }>(
    `/prompts/${promptId}/versions?limit=${limit}`,
    {
      headers
    }
  );
  return response.data;
}

export async function recordPromptUsage(
  promptId: string,
  tenantId: string,
  payload: UsageEventPayload = {},
  token?: string
): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  await request(`/prompts/${promptId}/usage`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

export async function fetchPromptAnalytics(
  tenantId: string,
  rangeDays: number,
  token?: string
): Promise<PromptAnalyticsResponse> {
  const query = new URLSearchParams({ range: String(rangeDays) });
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request<PromptAnalyticsResponse>(`/analytics/prompts?${query.toString()}`, {
    headers
  });
}

export async function fetchPromptSuggestions(
  tenantId: string,
  search: string,
  token?: string,
  limit = 5
): Promise<PromptSuggestion[]> {
  const params = new URLSearchParams({ q: search, limit: String(limit) });
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptSuggestion[] }>(
    `/prompts/search/suggestions?${params.toString()}`,
    { headers }
  );
  return response.data;
}

export async function fetchDashboardOverview(
  tenantId: string,
  rangeDays: number,
  token?: string
): Promise<DashboardOverviewResponse> {
  const params = new URLSearchParams({ range: String(rangeDays) });
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request<{ data: DashboardOverviewResponse }>(
    `/analytics/overview?${params.toString()}`,
    { headers }
  );
  return response.data;
}

export async function fetchPromptComments(
  promptId: string,
  tenantId: string,
  token?: string
): Promise<PromptComment[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptComment[] }>(`/prompts/${promptId}/comments`, {
    headers
  });
  return response.data;
}

export async function createPromptComment(
  promptId: string,
  tenantId: string,
  payload: { body: string; parentId?: string | null },
  token?: string
): Promise<PromptComment> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptComment }>(`/prompts/${promptId}/comments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updatePromptComment(
  commentId: string,
  tenantId: string,
  payload: Partial<{ body: string; resolved: boolean }>,
  token?: string
): Promise<PromptComment> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptComment }>(`/comments/${commentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function deletePromptComment(
  commentId: string,
  tenantId: string,
  token?: string
): Promise<void> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  await request(`/comments/${commentId}`, {
    method: "DELETE",
    headers
  });
}

export async function fetchPromptShares(
  promptId: string,
  tenantId: string,
  token?: string
): Promise<PromptShare[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptShare[] }>(`/prompts/${promptId}/shares`, {
    headers
  });
  return response.data;
}

export async function createPromptShare(
  promptId: string,
  tenantId: string,
  payload: {
    targetType: ShareTargetType;
    targetIdentifier: string;
    role: ShareRole;
    expiresAt?: string | null;
  },
  token?: string
): Promise<PromptShare[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptShare[] }>(`/prompts/${promptId}/shares`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function removePromptShare(
  promptId: string,
  shareId: string,
  tenantId: string,
  token?: string
): Promise<PromptShare[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptShare[] }>(
    `/prompts/${promptId}/shares/${shareId}`,
    {
      method: "DELETE",
      headers
    }
  );
  return response.data;
}

export async function fetchPromptApprovals(
  promptId: string,
  tenantId: string,
  token?: string
): Promise<PromptApproval[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptApproval[] }>(`/prompts/${promptId}/approvals`, {
    headers
  });
  return response.data;
}

export async function requestPromptApproval(
  promptId: string,
  tenantId: string,
  payload: { approver: string; message?: string | null },
  token?: string
): Promise<PromptApproval[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptApproval[] }>(`/prompts/${promptId}/approvals`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updatePromptApproval(
  approvalId: string,
  tenantId: string,
  payload: { status: ApprovalStatus; message?: string | null },
  token?: string
): Promise<PromptApproval> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptApproval }>(`/approvals/${approvalId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function fetchPromptActivity(
  promptId: string,
  tenantId: string,
  token?: string
): Promise<PromptActivityEntry[]> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: PromptActivityEntry[] }>(`/prompts/${promptId}/activity`, {
    headers
  });
  return response.data;
}

export async function fetchNotifications(token?: string): Promise<NotificationItem[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: NotificationItem[] }>(`/notifications`, {
    headers
  });
  return response.data;
}

export async function markNotificationRead(id: string, token?: string): Promise<NotificationItem> {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await request<{ data: NotificationItem }>(`/notifications/${id}`, {
    method: "PATCH",
    headers
  });
  return response.data;
}

function resolveBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envValue) {
    return envValue.replace(/\/$/, "");
  }

  const globalValue = (
    globalThis as Record<string, unknown> & {
      __PROMPT_MANAGER_API_BASE__?: string;
    }
  ).__PROMPT_MANAGER_API_BASE__;

  if (typeof globalValue === "string" && globalValue.trim()) {
    return globalValue.trim().replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "";
}

export function serializeMetadata(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) return "";
  return JSON.stringify(metadata, null, 2);
}
