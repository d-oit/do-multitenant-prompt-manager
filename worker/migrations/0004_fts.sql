PRAGMA foreign_keys = ON;

-- Create virtual table for full-text search over prompts content
CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  title,
  body,
  tags,
  metadata,
  tokenize = "unicode61 remove_diacritics 2",
  content = prompts,
  content_rowid = rowid
);

-- Maintain vocabulary table for generating search suggestions
CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts_vocab
USING fts5vocab(prompts_fts, 'row');

-- Ensure triggers are recreated to sync the FTS table with primary storage
DROP TRIGGER IF EXISTS prompts_ai;
DROP TRIGGER IF EXISTS prompts_ad;
DROP TRIGGER IF EXISTS prompts_au;

CREATE TRIGGER prompts_ai AFTER INSERT ON prompts BEGIN
  INSERT INTO prompts_fts(rowid, title, body, tags, metadata)
  VALUES (new.rowid, new.title, new.body, new.tags, new.metadata);
END;

CREATE TRIGGER prompts_ad AFTER DELETE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, body, tags, metadata)
  VALUES('delete', old.rowid, old.title, old.body, old.tags, old.metadata);
END;

CREATE TRIGGER prompts_au AFTER UPDATE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, body, tags, metadata)
  VALUES('delete', old.rowid, old.title, old.body, old.tags, old.metadata);
  INSERT INTO prompts_fts(rowid, title, body, tags, metadata)
  VALUES (new.rowid, new.title, new.body, new.tags, new.metadata);
END;
