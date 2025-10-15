import type { Tenant } from "../../../shared/types";
import { DEFAULT_TENANT_ID } from "../constants";
import type { Env } from "../types";
import { jsonResponse } from "./json";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ResolveTenantOptions {
  requireTenant?: boolean;
  allowDefault?: boolean;
}

export interface TenantResolution {
  tenantId: string;
  tenant: Tenant;
  fromDefault: boolean;
}

export async function ensureTenant(env: Env, tenantIdentifier: string): Promise<Tenant> {
  const candidate = tenantIdentifier || DEFAULT_TENANT_ID;
  let record = await env.DB.prepare("SELECT * FROM tenants WHERE id = ?")
    .bind(candidate)
    .first<TenantRow>();

  if (!record) {
    record = await env.DB.prepare("SELECT * FROM tenants WHERE slug = ?")
      .bind(candidate.toLowerCase())
      .first<TenantRow>();
  }

  if (!record) {
    throw jsonResponse({ error: "Tenant not found" }, 404);
  }

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    createdAt: record.created_at
  };
}

export async function resolveTenantId(
  request: Request,
  url: URL,
  env: Env,
  options: ResolveTenantOptions
): Promise<TenantResolution> {
  const headerTenant = request.headers.get("x-tenant-id")?.trim();
  const queryTenant = url.searchParams.get("tenantId")?.trim();
  let tenantIdentifier = headerTenant || queryTenant || undefined;

  if (!tenantIdentifier && options.allowDefault) {
    tenantIdentifier = DEFAULT_TENANT_ID;
  }

  if (!tenantIdentifier) {
    if (options.requireTenant) {
      throw jsonResponse({ error: "tenantId is required" }, 400);
    }
    tenantIdentifier = DEFAULT_TENANT_ID;
  }

  const tenant = await ensureTenant(env, tenantIdentifier);
  return {
    tenantId: tenant.id,
    tenant,
    fromDefault: tenant.id === DEFAULT_TENANT_ID && !headerTenant && !queryTenant
  };
}
