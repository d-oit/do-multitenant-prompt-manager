-- Multi-tenancy, versioning, and analytics expansion
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE prompts ADD COLUMN tenant_id TEXT;
ALTER TABLE prompts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE prompts ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;

UPDATE prompts SET tenant_id = 'default' WHERE tenant_id IS NULL;

ALTER TABLE prompts
  ADD COLUMN created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_prompts_tenant ON prompts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_prompts_tenant_title ON prompts (tenant_id, title COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS prompt_versions (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_versions_unique ON prompt_versions (prompt_id, version);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_tenant ON prompt_versions (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prompt_usage_events (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_usage_tenant_prompt ON prompt_usage_events (tenant_id, prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_occurred_at ON prompt_usage_events (occurred_at DESC);

INSERT OR IGNORE INTO tenants (id, name, slug, created_at)
VALUES ('default', 'Default Workspace', 'default', CURRENT_TIMESTAMP);

UPDATE prompts SET tenant_id = 'default' WHERE tenant_id IS NULL;

CREATE VIEW IF NOT EXISTS prompt_usage_daily AS
SELECT
  tenant_id,
  prompt_id,
  DATE(occurred_at) AS day,
  COUNT(*) AS usage_count
FROM prompt_usage_events
GROUP BY tenant_id, prompt_id, day;
