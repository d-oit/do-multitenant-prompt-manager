import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import type { ExecutionContext } from "@cloudflare/workers-types";
import worker from "../src/index";
import { hashPassword } from "../src/auth";
import { buildCacheKey } from "../src/lib/cache";
import { DEFAULT_PAGE_SIZE } from "../src/constants";

const baseHeaders = {
  "Content-Type": "application/json",
  "X-Tenant-Id": "default"
};

const adminCredentials = {
  email: "admin@example.com",
  password: "super-secret"
};

let authToken = "";

async function apiFetch(path: string, init?: RequestInit) {
  const pending: Promise<unknown>[] = [];
  const ctx: ExecutionContext = {
    waitUntil(promise) {
      pending.push(promise);
    },
    passThroughOnException() {}
  };

  const request = new Request(`https://example.com${path}`, init);
  const response = await worker.fetch(request, env, ctx);
  if (pending.length) {
    await Promise.all(pending);
  }
  return response;
}

function authorizedHeaders(overrides?: Record<string, string>) {
  return {
    ...baseHeaders,
    Authorization: `Bearer ${authToken}`,
    ...(overrides ?? {})
  };
}

beforeAll(async () => {
  await env.DB.exec("PRAGMA foreign_keys = ON;");
  env.JWT_SECRET = "test-secret";
  env.ACCESS_TOKEN_TTL_SECONDS = "3600";
  env.REFRESH_TOKEN_TTL_SECONDS = "604800";

  const statements = [
    `CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      archived INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );`,
    `CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
      title,
      body,
      tags,
      metadata,
      content='prompts',
      content_rowid='rowid'
    );`,
    `CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
      INSERT INTO prompts_fts(rowid, title, body, tags, metadata)
      VALUES (new.rowid, new.title, new.body, new.tags, new.metadata);
    END;`,
    `CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
      INSERT INTO prompts_fts(prompts_fts, rowid, title, body, tags, metadata)
      VALUES('delete', old.rowid, old.title, old.body, old.tags, old.metadata);
    END;`,
    `CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
      INSERT INTO prompts_fts(prompts_fts, rowid, title, body, tags, metadata)
      VALUES('delete', old.rowid, old.title, old.body, old.tags, old.metadata);
      INSERT INTO prompts_fts(rowid, title, body, tags, metadata)
      VALUES (new.rowid, new.title, new.body, new.tags, new.metadata);
    END;`,
    `CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts (created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_prompts_title ON prompts (tenant_id, title COLLATE NOCASE);`,
    `CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      metadata TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT,
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS prompt_usage_events (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      tenant_id TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id, tenant_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      tenant_id TEXT,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      revoked INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `INSERT OR IGNORE INTO tenants (id, name, slug, created_at)
     VALUES ('default', 'Default Workspace', 'default', CURRENT_TIMESTAMP);`,
    `INSERT OR IGNORE INTO roles (id, name, description, permissions) VALUES
      ('role-admin', 'admin', 'Full administrative access', '["*"]'),
      ('role-editor', 'editor', 'Create and manage prompts', '["prompt:read","prompt:write","analytics:read"]'),
      ('role-viewer', 'viewer', 'Read-only prompts and analytics access', '["prompt:read","analytics:read"]');`
  ];

  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }

  const passwordHash = await hashPassword(adminCredentials.password);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind("user-admin", adminCredentials.email, passwordHash, "Test Admin", now, now)
    .run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO user_roles (user_id, role_id, tenant_id, created_at)
     VALUES (?, ?, NULL, ?)`
  )
    .bind("user-admin", "role-admin", now)
    .run();
});

beforeEach(async () => {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminCredentials)
  });

  expect(response.status).toBe(200);
  const body = await response.json();
  authToken = body.data.accessToken;
});

afterEach(async () => {
  await env.DB.exec(`
    DELETE FROM prompt_usage_events;
    DELETE FROM prompt_versions;
    DELETE FROM prompts;
    DELETE FROM refresh_tokens;
    DELETE FROM api_keys;
  `);
  let cursor: string | undefined;
  do {
    const { keys, list_complete, cursor: next } = await env.PROMPT_CACHE.list({ cursor });
    await Promise.all(keys.map((entry) => env.PROMPT_CACHE.delete(entry.name)));
    cursor = list_complete ? undefined : next;
  } while (cursor);
  authToken = "";
  env.RATE_LIMIT_MAX_REQUESTS = undefined;
  env.RATE_LIMIT_WINDOW_SECONDS = undefined;
});

describe("prompt API", () => {
  it("creates and returns a prompt", async () => {
    const createResponse = await apiFetch("/prompts", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        tenantId: "default",
        title: "Greeting",
        body: "Say hello to the user",
        tags: ["greeting"],
        metadata: { category: "demo" }
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.data.title).toBe("Greeting");
    expect(created.data.tags).toEqual(["greeting"]);
    expect(created.data.tenantId).toBe("default");
    expect(created.data.version).toBe(1);

    const listResponse = await apiFetch("/prompts?tenantId=default&sortBy=created_at&order=desc&page=1&pageSize=10", {
      headers: authorizedHeaders()
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].title).toBe("Greeting");
    expect(listBody.data[0].tenantId).toBe("default");
  });

  it("supports filtering by search, tag, and metadata", async () => {
    const payloads = [
      {
        tenantId: "default",
        title: "Support request",
        body: "Help the user troubleshoot",
        tags: ["support", "priority"],
        metadata: { category: "support" }
      },
      {
        tenantId: "default",
        title: "Product pitch",
        body: "Highlight premium plan",
        tags: ["sales"],
        metadata: { category: "marketing" }
      }
    ];

    for (const payload of payloads) {
      const response = await apiFetch("/prompts", {
        method: "POST",
        headers: authorizedHeaders(),
        body: JSON.stringify(payload)
      });
      expect(response.status).toBe(201);
    }

    const tagResponse = await apiFetch("/prompts?tenantId=default&tag=support", {
      headers: authorizedHeaders()
    });
    const tagBody = await tagResponse.json();
    expect(tagBody.data).toHaveLength(1);
    expect(tagBody.data[0].title).toBe("Support request");

    const searchResponse = await apiFetch("/prompts?tenantId=default&search=pitch", {
      headers: authorizedHeaders()
    });
    const searchBody = await searchResponse.json();
    expect(searchBody.data).toHaveLength(1);
    expect(searchBody.data[0].title).toBe("Product pitch");

    const metadataResponse = await apiFetch("/prompts?tenantId=default&metadataKey=category&metadataValue=support", {
      headers: authorizedHeaders()
    });
    const metadataBody = await metadataResponse.json();
    expect(metadataBody.data).toHaveLength(1);
    expect(metadataBody.data[0].metadata.category).toBe("support");
  });

  it("returns highlighted search results and suggestions", async () => {
    const create = await apiFetch("/prompts", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        tenantId: "default",
        title: "Assistant greeting",
        body: "Assist the customer with onboarding tasks",
        tags: ["assistant"],
        metadata: { category: "welcome" }
      })
    });
    expect(create.status).toBe(201);
    const { data: createdPrompt } = await create.json();

    const searchResponse = await apiFetch("/prompts?tenantId=default&search=assist", {
      headers: authorizedHeaders()
    });
    expect(searchResponse.status).toBe(200);
    const searchBody = await searchResponse.json();
    expect(searchBody.highlights).toBeDefined();
    const highlight = (searchBody.highlights || []).find((entry: { promptId: string }) => entry.promptId === createdPrompt.id);
    expect(highlight).toBeDefined();
    expect((highlight?.body || "").toLowerCase()).toContain("<mark>assist</mark>");

    const suggestionsResponse = await apiFetch("/prompts/search/suggestions?q=assist", {
      headers: authorizedHeaders()
    });
    expect(suggestionsResponse.status).toBe(200);
    const suggestionsBody = await suggestionsResponse.json();
    expect(Array.isArray(suggestionsBody.data)).toBe(true);
    expect(suggestionsBody.data.length).toBeGreaterThan(0);
    expect((suggestionsBody.data[0].highlight || "").toLowerCase()).toContain("<mark>");
  });

  it("rejects unauthorized writes when no token provided", async () => {
    authToken = "";

    const response = await apiFetch("/prompts", {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        tenantId: "default",
        title: "Restricted",
        body: "Should fail",
        tags: [],
        metadata: null
      })
    });

    expect(response.status).toBe(401);
  });

  it("enforces rate limits when exceeded", async () => {
    env.RATE_LIMIT_MAX_REQUESTS = "3";
    env.RATE_LIMIT_WINDOW_SECONDS = "60";

    const first = await apiFetch("/prompts?tenantId=default", { headers: authorizedHeaders() });
    expect(first.status).toBe(200);

    const second = await apiFetch("/prompts?tenantId=default", { headers: authorizedHeaders() });
    expect(second.status).toBe(200);

    const limited = await apiFetch("/prompts?tenantId=default", { headers: authorizedHeaders() });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("60");
    const body = await limited.json();
    expect(body.error).toBe("Too Many Requests");
  });

  it("maintains prompt versions after updates", async () => {
    const create = await apiFetch("/prompts", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        tenantId: "default",
        title: "Script",
        body: "Original",
        tags: ["v1"],
        metadata: { locale: "en" },
        createdBy: "writer@acme.com"
      })
    });
    expect(create.status).toBe(201);
    const created = await create.json();
    const promptId = created.data.id;

    const update = await apiFetch(`/prompts/${promptId}`, {
      method: "PUT",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        title: "Script v2",
        metadata: { locale: "en", tone: "friendly" },
        createdBy: "editor@acme.com"
      })
    });
    expect(update.status).toBe(200);
    const updated = await update.json();
    expect(updated.data.version).toBe(2);

    const versions = await apiFetch(`/prompts/${promptId}/versions?tenantId=default`, {
      headers: authorizedHeaders()
    });
    expect(versions.status).toBe(200);
    const body = await versions.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].version).toBe(2);
    expect(body.data[1].version).toBe(1);
    expect(body.prompt.version).toBe(2);
  });

  it("records usage events and returns analytics", async () => {
    const create = await apiFetch("/prompts", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        tenantId: "default",
        title: "FAQ",
        body: "Answer question",
        tags: ["help"],
        metadata: null
      })
    });
    const created = await create.json();
    const promptId = created.data.id;

    for (let i = 0; i < 3; i += 1) {
      const usage = await apiFetch(`/prompts/${promptId}/usage`, {
        method: "POST",
        headers: authorizedHeaders(),
        body: JSON.stringify({ metadata: { channel: "chat", idx: i } })
      });
      expect(usage.status).toBe(200);
    }

    const analytics = await apiFetch("/analytics/prompts?tenantId=default&range=30", {
      headers: authorizedHeaders()
    });
    expect(analytics.status).toBe(200);
    const summary = await analytics.json();
    const entry = summary.data.find((row: { promptId: string }) => row.promptId === promptId);
    expect(entry).toBeDefined();
    expect(entry?.usageCount).toBe(3);
  });

  it("provides dashboard overview metrics", async () => {
    const create = await apiFetch("/prompts", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        tenantId: "default",
        title: "Overview Prompt",
        body: "Use for analytics overview",
        tags: ["overview"],
        metadata: null
      })
    });
    expect(create.status).toBe(201);
    const created = await create.json();
    const promptId = created.data.id;

    await apiFetch(`/prompts/${promptId}/usage`, {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({ metadata: { channel: "dashboard" } })
    });

    const overview = await apiFetch("/analytics/overview?tenantId=default&range=7", {
      headers: authorizedHeaders()
    });
    expect(overview.status).toBe(200);
    const payload = await overview.json();
    expect(payload.data.stats.totalPrompts.value).toBeGreaterThan(0);
    expect(Array.isArray(payload.data.trend)).toBe(true);
    expect(payload.data.trend.length).toBe(7);
    expect(Array.isArray(payload.data.topPrompts)).toBe(true);
    expect(payload.data.topPrompts.length).toBeGreaterThan(0);
  });

  it("manages tenants via dedicated endpoints", async () => {
    const createTenant = await apiFetch("/tenants", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        name: "Beta Workspace",
        slug: "beta"
      })
    });
    expect(createTenant.status).toBe(201);
    const { data: tenant } = await createTenant.json();
    expect(tenant.slug).toBe("beta");

    const tenants = await apiFetch("/tenants", {
      headers: authorizedHeaders()
    });
    expect(tenants.status).toBe(200);
    const list = await tenants.json();
    const ids = list.data.map((item: { slug: string }) => item.slug);
    expect(ids).toContain("beta");
    expect(ids).toContain("default");
  });

  it("invalidates cached prompt lists after updates", async () => {
    const create = await apiFetch("/prompts", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        tenantId: "default",
        title: "Cache sample",
        body: "Initial body",
        tags: ["cache"],
        metadata: null
      })
    });
    expect(create.status).toBe(201);
    const created = await create.json();
    const promptId = created.data.id;

    const listResponse = await apiFetch(`/prompts?tenantId=default&sortBy=created_at&order=desc&page=1&pageSize=${DEFAULT_PAGE_SIZE}`, {
      headers: authorizedHeaders()
    });
    expect(listResponse.status).toBe(200);

    const cacheKey = buildCacheKey({
      tenantId: "default",
      sortField: "created_at",
      order: "DESC",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE
    });

    type PromptCacheEntry = {
      payload?: {
        data?: Array<{ title?: string }>;
      };
    } | null;

    const initialCache = (await env.PROMPT_CACHE.get(cacheKey, { type: "json" })) as PromptCacheEntry;
    expect(initialCache).toBeTruthy();
    expect(initialCache?.payload?.data?.[0]?.title).toBe("Cache sample");

    const update = await apiFetch(`/prompts/${promptId}`, {
      method: "PUT",
      headers: authorizedHeaders(),
      body: JSON.stringify({ title: "Cache sample updated" })
    });
    expect(update.status).toBe(200);

    const updatedList = await apiFetch(`/prompts?tenantId=default&sortBy=created_at&order=desc&page=1&pageSize=${DEFAULT_PAGE_SIZE}`, {
      headers: authorizedHeaders()
    });
    expect(updatedList.status).toBe(200);
    const updatedBody = await updatedList.json();
    expect(updatedBody.data[0].title).toBe("Cache sample updated");

    const refreshedCache = (await env.PROMPT_CACHE.get(cacheKey, { type: "json" })) as PromptCacheEntry;
    expect(refreshedCache?.payload?.data?.[0]?.title).toBe("Cache sample updated");
  });

  it("rotates API keys and invalidates previous secrets", async () => {
    const createKey = await apiFetch("/api-keys", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        name: "CLI key",
        roleId: "role-admin"
      })
    });
    expect(createKey.status).toBe(201);
    const created = await createKey.json();
    const apiKeyId = created.data.id as string;
    const originalKey = created.data.key as string;

    const rotate = await apiFetch(`/api-keys/${apiKeyId}/rotate`, {
      method: "POST",
      headers: authorizedHeaders()
    });
    expect(rotate.status).toBe(200);
    const rotated = await rotate.json();
    const newKey = rotated.data.key as string;
    expect(newKey).toBeTruthy();
    expect(newKey).not.toBe(originalKey);

    const oldKeyResponse = await apiFetch("/tenants", {
      headers: {
        ...baseHeaders,
        "X-API-Key": originalKey
      }
    });
    expect(oldKeyResponse.status).toBe(401);

    const newKeyResponse = await apiFetch("/tenants", {
      headers: {
        ...baseHeaders,
        "X-API-Key": newKey
      }
    });
    expect(newKeyResponse.status).toBe(200);
  });

  it("enforces per-key rate limits", async () => {
    env.RATE_LIMIT_MAX_REQUESTS = "2";
    env.RATE_LIMIT_WINDOW_SECONDS = "60";

    const createKey = await apiFetch("/api-keys", {
      method: "POST",
      headers: authorizedHeaders(),
      body: JSON.stringify({
        name: "Rate limited key",
        roleId: "role-admin"
      })
    });
    expect(createKey.status).toBe(201);
    const created = await createKey.json();
    const apiKey = created.data.key as string;

    const first = await apiFetch("/tenants", {
      headers: {
        ...baseHeaders,
        "X-API-Key": apiKey
      }
    });
    expect(first.status).toBe(200);

    const second = await apiFetch("/tenants", {
      headers: {
        ...baseHeaders,
        "X-API-Key": apiKey
      }
    });
    expect(second.status).toBe(200);

    const third = await apiFetch("/tenants", {
      headers: {
        ...baseHeaders,
        "X-API-Key": apiKey
      }
    });
    expect(third.status).toBe(429);
  });
});
