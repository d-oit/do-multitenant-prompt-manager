/**
 * Bulk Operations Module
 * Handles bulk create, update, delete, and tag management for prompts
 */

import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";

// Validation schemas
const BulkCreateSchema = z.object({
  prompts: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1),
        tags: z.array(z.string()).optional().default([]),
        metadata: z.record(z.any()).optional()
      })
    )
    .min(1)
    .max(100) // Limit to 100 items per bulk operation
});

const BulkUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        body: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        metadata: z.record(z.any()).optional(),
        archived: z.boolean().optional()
      })
    )
    .min(1)
    .max(100)
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(100)
});

const BulkTagSchema = z.object({
  promptIds: z.array(z.string()).min(1).max(100),
  tags: z.array(z.string()).min(1),
  action: z.enum(["add", "remove", "replace"])
});

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id?: string; error: string }>;
  results?: Array<{ id: string; success: boolean; metadata?: Record<string, unknown> }>;
}

function createId(): string {
  return crypto.randomUUID();
}

/**
 * Bulk create prompts
 */
export async function bulkCreatePrompts(
  db: D1Database,
  tenantId: string,
  data: unknown,
  createdBy?: string | null
): Promise<BulkOperationResult> {
  const validated = BulkCreateSchema.parse(data);
  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
    results: []
  };

  // Use transaction for atomicity
  const timestamp = new Date().toISOString();

  for (const prompt of validated.prompts) {
    try {
      const id = createId();
      const tags = JSON.stringify(prompt.tags || []);
      const metadata = prompt.metadata ? JSON.stringify(prompt.metadata) : null;

      await db
        .prepare(
          `INSERT INTO prompts (id, tenant_id, title, body, tags, metadata, created_at, updated_at, version, archived, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
        )
        .bind(
          id,
          tenantId,
          prompt.title,
          prompt.body,
          tags,
          metadata,
          timestamp,
          timestamp,
          1,
          createdBy ?? null
        )
        .run();

      results.success++;
      results.results?.push({
        id,
        success: true,
        metadata: {
          title: prompt.title,
          body: prompt.body,
          tags: prompt.tags ?? [],
          metadata: prompt.metadata ?? null,
          createdAt: timestamp,
          createdBy: createdBy ?? null
        }
      });
    } catch (error) {
      results.failed++;
      results.errors.push({
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return results;
}

/**
 * Bulk update prompts
 */
export async function bulkUpdatePrompts(
  db: D1Database,
  tenantId: string,
  data: unknown
): Promise<BulkOperationResult> {
  const validated = BulkUpdateSchema.parse(data);
  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
    results: []
  };

  const timestamp = new Date().toISOString();

  for (const update of validated.updates) {
    try {
      // First check if prompt exists and belongs to tenant
      const existing = await db
        .prepare(
          "SELECT id, title, body, tags, metadata, version FROM prompts WHERE id = ? AND tenant_id = ?"
        )
        .bind(update.id, tenantId)
        .first<{
          id: string;
          title: string;
          body: string;
          tags: string;
          metadata: string | null;
          version: number;
        }>();

      if (!existing) {
        results.failed++;
        results.errors.push({
          id: update.id,
          error: "Prompt not found or access denied"
        });
        continue;
      }

      // Build dynamic update query
      const updates: string[] = [];
      const bindings: unknown[] = [];
      const updatedFields: string[] = [];
      let versionIncremented = false;

      if (update.title !== undefined) {
        updates.push("title = ?");
        bindings.push(update.title);
        if (update.title !== existing.title) {
          updatedFields.push("title");
        }
      }
      if (update.body !== undefined) {
        updates.push("body = ?");
        bindings.push(update.body);
        if (update.body !== existing.body) {
          updatedFields.push("body");
        }
      }
      if (update.tags !== undefined) {
        updates.push("tags = ?");
        bindings.push(JSON.stringify(update.tags));
        if (JSON.stringify(update.tags) !== existing.tags) {
          updatedFields.push("tags");
        }
      }
      if (update.metadata !== undefined) {
        const metadataValue = update.metadata === null ? null : JSON.stringify(update.metadata);
        updates.push("metadata = ?");
        bindings.push(metadataValue);
        if (metadataValue !== existing.metadata) {
          updatedFields.push("metadata");
        }
      }
      if (update.archived !== undefined) {
        updates.push("archived = ?");
        bindings.push(update.archived ? 1 : 0);
        updatedFields.push("archived");
      }

      if (updates.length === 0) {
        results.failed++;
        results.errors.push({
          id: update.id,
          error: "No fields to update"
        });
        continue;
      }

      if (
        updatedFields.length > 0 &&
        (update.title !== undefined ||
          update.body !== undefined ||
          update.tags !== undefined ||
          update.metadata !== undefined)
      ) {
        updates.push("version = ?");
        const nextVersion =
          (typeof existing.version === "number"
            ? existing.version
            : Number(existing.version ?? 1)) + 1;
        bindings.push(nextVersion);
        versionIncremented = true;
      }

      updates.push("updated_at = ?");
      bindings.push(timestamp);

      // Add WHERE clause bindings
      bindings.push(update.id, tenantId);

      const query = `UPDATE prompts SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`;
      await db
        .prepare(query)
        .bind(...bindings)
        .run();

      results.success++;
      results.results?.push({
        id: update.id,
        success: true,
        metadata: {
          updatedFields,
          versionIncremented,
          updatedAt: timestamp
        }
      });
    } catch (error) {
      results.failed++;
      results.errors.push({
        id: update.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return results;
}

/**
 * Bulk delete prompts
 */
export async function bulkDeletePrompts(
  db: D1Database,
  tenantId: string,
  data: unknown
): Promise<BulkOperationResult> {
  const validated = BulkDeleteSchema.parse(data);
  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
    results: []
  };

  for (const id of validated.ids) {
    try {
      // Verify ownership before deletion
      const existing = await db
        .prepare("SELECT id FROM prompts WHERE id = ? AND tenant_id = ?")
        .bind(id, tenantId)
        .first();

      if (!existing) {
        results.failed++;
        results.errors.push({
          id,
          error: "Prompt not found or access denied"
        });
        continue;
      }

      await db
        .prepare("DELETE FROM prompts WHERE id = ? AND tenant_id = ?")
        .bind(id, tenantId)
        .run();

      results.success++;
      results.results?.push({ id, success: true });
    } catch (error) {
      results.failed++;
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return results;
}

/**
 * Bulk tag management (add, remove, replace tags)
 */
export async function bulkManageTags(
  db: D1Database,
  tenantId: string,
  data: unknown
): Promise<BulkOperationResult> {
  const validated = BulkTagSchema.parse(data);
  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
    results: []
  };

  const timestamp = new Date().toISOString();

  for (const promptId of validated.promptIds) {
    try {
      // Get current prompt
      const prompt = await db
        .prepare("SELECT id, tags FROM prompts WHERE id = ? AND tenant_id = ?")
        .bind(promptId, tenantId)
        .first<{ id: string; tags: string }>();

      if (!prompt) {
        results.failed++;
        results.errors.push({
          id: promptId,
          error: "Prompt not found or access denied"
        });
        continue;
      }

      let currentTags: string[] = [];
      try {
        currentTags = JSON.parse(prompt.tags);
      } catch {
        currentTags = [];
      }

      let newTags: string[] = [];

      switch (validated.action) {
        case "add":
          // Add new tags, avoiding duplicates
          newTags = [...new Set([...currentTags, ...validated.tags])];
          break;
        case "remove":
          // Remove specified tags
          newTags = currentTags.filter((tag) => !validated.tags.includes(tag));
          break;
        case "replace":
          // Replace all tags
          newTags = validated.tags;
          break;
      }

      await db
        .prepare(
          "UPDATE prompts SET tags = ?, updated_at = ?, version = version + 1 WHERE id = ? AND tenant_id = ?"
        )
        .bind(JSON.stringify(newTags), timestamp, promptId, tenantId)
        .run();

      results.success++;
      results.results?.push({
        id: promptId,
        success: true,
        metadata: {
          tags: newTags,
          updatedAt: timestamp,
          versionIncremented: true
        }
      });
    } catch (error) {
      results.failed++;
      results.errors.push({
        id: promptId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return results;
}

/**
 * Bulk archive/unarchive prompts
 */
export async function bulkArchivePrompts(
  db: D1Database,
  tenantId: string,
  ids: string[],
  archived: boolean
): Promise<BulkOperationResult> {
  const results: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
    results: []
  };

  const timestamp = new Date().toISOString();

  for (const id of ids) {
    try {
      const existing = await db
        .prepare("SELECT id FROM prompts WHERE id = ? AND tenant_id = ?")
        .bind(id, tenantId)
        .first();

      if (!existing) {
        results.failed++;
        results.errors.push({
          id,
          error: "Prompt not found or access denied"
        });
        continue;
      }

      await db
        .prepare("UPDATE prompts SET archived = ?, updated_at = ? WHERE id = ? AND tenant_id = ?")
        .bind(archived ? 1 : 0, timestamp, id, tenantId)
        .run();

      results.success++;
      results.results?.push({
        id,
        success: true,
        metadata: {
          archived,
          updatedAt: timestamp
        }
      });
    } catch (error) {
      results.failed++;
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return results;
}
