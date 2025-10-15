/**
 * Import/Export Module
 * Handles exporting prompts to JSON/CSV and importing from JSON
 */

import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";

// Export format version
const EXPORT_VERSION = "1.0";

interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string;
  metadata: string | null;
  created_at: string;
  updated_at: string;
  archived: number;
}

interface ExportFormat {
  version: string;
  exportedAt: string;
  tenant: string;
  count: number;
  prompts: Array<{
    title: string;
    body: string;
    tags: string[];
    metadata?: Record<string, unknown>;
    archived?: boolean;
  }>;
}

const ImportSchema = z.object({
  version: z.string().optional(),
  prompts: z.array(
    z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1),
      tags: z.array(z.string()).optional().default([]),
      metadata: z.record(z.string(), z.unknown()).optional(),
      archived: z.boolean().optional().default(false)
    })
  ),
  conflictStrategy: z.enum(["skip", "overwrite", "duplicate"]).optional().default("skip")
});

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  preview?: Array<{
    title: string;
    status: "new" | "exists" | "error";
  }>;
  records?: Array<{ id: string; action: "created" | "updated" }>;
}

/**
 * Export prompts to JSON format
 */
export async function exportPromptsJSON(
  db: D1Database,
  tenantId: string,
  options?: {
    includeArchived?: boolean;
    tags?: string[];
  }
): Promise<ExportFormat> {
  let query =
    "SELECT id, title, body, tags, metadata, created_at, updated_at, archived FROM prompts WHERE tenant_id = ?";
  const bindings: unknown[] = [tenantId];

  if (!options?.includeArchived) {
    query += " AND archived = 0";
  }

  if (options?.tags && options.tags.length > 0) {
    // Filter by tags (check if any of the requested tags are in the tags array)
    const tagConditions = options.tags.map(() => "tags LIKE ?").join(" OR ");
    query += ` AND (${tagConditions})`;
    options.tags.forEach((tag) => {
      bindings.push(`%"${tag}"%`);
    });
  }

  query += " ORDER BY created_at DESC";

  const result = await db
    .prepare(query)
    .bind(...bindings)
    .all<Prompt>();

  const prompts = result.results.map((p) => {
    let tags: string[] = [];
    let metadata: Record<string, unknown> | undefined;

    try {
      tags = JSON.parse(p.tags);
    } catch {
      tags = [];
    }

    try {
      if (p.metadata) {
        metadata = JSON.parse(p.metadata);
      }
    } catch {
      metadata = undefined;
    }

    return {
      title: p.title,
      body: p.body,
      tags,
      metadata,
      archived: p.archived === 1
    };
  });

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tenant: tenantId,
    count: prompts.length,
    prompts
  };
}

/**
 * Export prompts to CSV format
 */
export async function exportPromptsCSV(
  db: D1Database,
  tenantId: string,
  options?: {
    includeArchived?: boolean;
    tags?: string[];
  }
): Promise<string> {
  const jsonExport = await exportPromptsJSON(db, tenantId, options);

  // CSV headers
  const headers = ["Title", "Body", "Tags", "Metadata", "Archived"];
  const rows: string[] = [headers.join(",")];

  // Convert each prompt to CSV row
  for (const prompt of jsonExport.prompts) {
    const row = [
      escapeCSV(prompt.title),
      escapeCSV(prompt.body),
      escapeCSV(prompt.tags.join(";")),
      escapeCSV(prompt.metadata ? JSON.stringify(prompt.metadata) : ""),
      prompt.archived ? "true" : "false"
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Helper function to escape CSV fields
 */
function escapeCSV(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Preview import - validate and check for conflicts without importing
 */
export async function previewImport(
  db: D1Database,
  tenantId: string,
  data: unknown
): Promise<ImportResult> {
  const validated = ImportSchema.parse(data);
  const result: ImportResult = {
    total: validated.prompts.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    preview: []
  };

  for (let i = 0; i < validated.prompts.length; i++) {
    const prompt = validated.prompts[i];

    try {
      // Check if prompt with same title exists
      const existing = await db
        .prepare("SELECT id FROM prompts WHERE tenant_id = ? AND title = ? COLLATE NOCASE")
        .bind(tenantId, prompt.title)
        .first();

      if (existing) {
        result.preview?.push({
          title: prompt.title,
          status: "exists"
        });
        result.skipped++;
      } else {
        result.preview?.push({
          title: prompt.title,
          status: "new"
        });
        result.imported++;
      }
    } catch (error) {
      result.preview?.push({
        title: prompt.title,
        status: "error"
      });
      result.failed++;
      result.errors.push({
        index: i,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return result;
}

/**
 * Import prompts from JSON
 */
export async function importPrompts(
  db: D1Database,
  tenantId: string,
  data: unknown,
  options?: { actorId?: string | null }
): Promise<ImportResult> {
  const validated = ImportSchema.parse(data);
  const result: ImportResult = {
    total: validated.prompts.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    records: []
  };

  const timestamp = new Date().toISOString();
  const actorId = options?.actorId ?? null;

  for (let i = 0; i < validated.prompts.length; i++) {
    const prompt = validated.prompts[i];

    try {
      // Check if prompt with same title exists
      const existing = await db
        .prepare("SELECT id, version FROM prompts WHERE tenant_id = ? AND title = ? COLLATE NOCASE")
        .bind(tenantId, prompt.title)
        .first<{ id: string; version: number }>();

      if (existing) {
        if (validated.conflictStrategy === "skip") {
          result.skipped++;
          continue;
        } else if (validated.conflictStrategy === "overwrite") {
          const nextVersion =
            (typeof existing.version === "number"
              ? existing.version
              : Number(existing.version ?? 1)) + 1;
          // Update existing prompt
          await db
            .prepare(
              `UPDATE prompts SET body = ?, tags = ?, metadata = ?, archived = ?, updated_at = ?, version = ?
               WHERE id = ? AND tenant_id = ?`
            )
            .bind(
              prompt.body,
              JSON.stringify(prompt.tags),
              prompt.metadata ? JSON.stringify(prompt.metadata) : null,
              prompt.archived ? 1 : 0,
              timestamp,
              nextVersion,
              existing.id,
              tenantId
            )
            .run();
          result.imported++;
          result.records?.push({ id: existing.id, action: "updated" });
          continue;
        }
        // If 'duplicate', fall through to create new
      }

      // Create new prompt
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO prompts (id, tenant_id, title, body, tags, metadata, created_at, updated_at, version, archived, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          tenantId,
          prompt.title,
          prompt.body,
          JSON.stringify(prompt.tags),
          prompt.metadata ? JSON.stringify(prompt.metadata) : null,
          timestamp,
          timestamp,
          1,
          prompt.archived ? 1 : 0,
          actorId
        )
        .run();

      result.imported++;
      result.records?.push({ id, action: "created" });
    } catch (error) {
      result.failed++;
      result.errors.push({
        index: i,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return result;
}

/**
 * Parse CSV to JSON format for import
 */
export function parseCSVToJSON(csvContent: string): {
  prompts: Array<{
    title: string;
    body: string;
    tags: string[];
    metadata?: Record<string, unknown>;
    archived?: boolean;
  }>;
} {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const prompts = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    if (fields.length < 2) continue; // Skip invalid lines

    const [title, body, tagsStr = "", metadataStr = "", archivedStr = "false"] = fields;

    let tags: string[] = [];
    if (tagsStr) {
      tags = tagsStr.split(";").filter((t) => t.trim());
    }

    let metadata: Record<string, unknown> | undefined;
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        metadata = undefined;
      }
    }

    prompts.push({
      title,
      body,
      tags,
      metadata,
      archived: archivedStr.toLowerCase() === "true"
    });
  }

  return { prompts };
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }

  fields.push(currentField);
  return fields;
}
