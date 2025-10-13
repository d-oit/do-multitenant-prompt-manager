PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_prompts_tenant_created
  ON prompts (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_tenant_updated
  ON prompts (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_tenant_archived
  ON prompts (tenant_id, archived);
