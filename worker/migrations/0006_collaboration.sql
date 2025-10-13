PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS prompt_comments (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  parent_id TEXT,
  body TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0,1)),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES prompt_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_comments_prompt ON prompt_comments (prompt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_parent ON prompt_comments (parent_id);

CREATE TABLE IF NOT EXISTS prompt_comment_activity (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (comment_id) REFERENCES prompt_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_comment_activity_comment ON prompt_comment_activity (comment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prompt_shares (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_identifier TEXT NOT NULL,
  role TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_shares_unique ON prompt_shares (prompt_id, tenant_id, target_type, target_identifier);

CREATE TABLE IF NOT EXISTS prompt_approval_requests (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approver TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_approval_prompt ON prompt_approval_requests (prompt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prompt_activity_log (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_activity_prompt ON prompt_activity_log (prompt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient, created_at DESC);
