/**
 * Database helpers for e2e tests
 * Provides utilities to setup and cleanup test data in real Cloudflare D1
 */

const API_BASE_URL = "http://localhost:8787";

export interface TestTenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface TestUser {
  email: string;
  password: string;
  token?: string;
}

/**
 * Create a test tenant
 */
export async function createTestTenant(
  name: string,
  slug: string,
  token?: string
): Promise<TestTenant> {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/tenants`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, slug })
  });

  if (!response.ok) {
    throw new Error(`Failed to create tenant: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all tenants
 */
export async function getAllTenants(token?: string): Promise<TestTenant[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/tenants`, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    throw new Error(`Failed to get tenants: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete all prompts for a tenant (cleanup)
 */
export async function cleanupTenantPrompts(tenantId: string, token?: string): Promise<void> {
  const headers: HeadersInit = {
    "X-Tenant-Id": tenantId
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/prompts?tenantId=${tenantId}`, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    console.warn(`Failed to fetch prompts for cleanup: ${response.statusText}`);
    return;
  }

  const result = await response.json();
  const prompts = result.data || [];

  // Delete each prompt
  for (const prompt of prompts) {
    await fetch(`${API_BASE_URL}/prompts/${prompt.id}`, {
      method: "DELETE",
      headers
    });
  }
}

/**
 * Wait for API to be ready
 */
export async function waitForApi(maxRetries = 60, delayMs = 500): Promise<void> {
  console.log(`Waiting for API at ${API_BASE_URL} to be ready...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: "GET"
      });
      if (response.status === 401 || response.status === 200) {
        // API is up (401 means auth is working, 200 means we're authenticated)
        console.log(`API is ready after ${i + 1} attempts`);
        return;
      }
      console.log(`Attempt ${i + 1}: Got status ${response.status}`);
    } catch {
      // Connection refused or network error
      if (i % 5 === 0) {
        console.log(`Attempt ${i + 1}: Connection error, retrying...`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("API did not become ready in time");
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
