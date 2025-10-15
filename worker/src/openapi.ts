export function getOpenAPIDocument(): Record<string, unknown> {
  return {
    openapi: "3.0.3",
    info: {
      title: "d.o. Prompt Manager API",
      version: "1.0.0",
      description:
        "REST API for managing prompt templates, analytics, and tenant resources in a multi-tenant environment. The API supports versioning via URL prefix (/v1/) or Accept-Version header."
    },
    servers: [
      { url: "https://api.example.com/v1", description: "Production (v1)" },
      { url: "https://staging-api.example.com/v1", description: "Staging (v1)" },
      { url: "http://localhost:8787/v1", description: "Local development (v1)" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Prompt: {
          type: "object",
          required: [
            "id",
            "tenantId",
            "title",
            "body",
            "tags",
            "createdAt",
            "updatedAt",
            "version"
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            tenantId: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            metadata: { type: "object", additionalProperties: true, nullable: true },
            archived: { type: "boolean" },
            createdBy: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            version: { type: "integer", minimum: 1 }
          }
        },
        PromptInput: {
          type: "object",
          required: ["tenantId", "title", "body"],
          properties: {
            tenantId: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            metadata: { type: "object", additionalProperties: true, nullable: true },
            archived: { type: "boolean" },
            createdBy: { type: "string" }
          }
        },
        PromptListResponse: {
          type: "object",
          required: ["data", "pagination"],
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Prompt" } },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                pageSize: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/prompts": {
        get: {
          summary: "List prompts",
          description: "Returns paginated prompts for a tenant.",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "tenantId", in: "query", required: false, schema: { type: "string" } },
            { name: "search", in: "query", required: false, schema: { type: "string" } },
            { name: "tag", in: "query", required: false, schema: { type: "string" } },
            { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
            {
              name: "pageSize",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20 }
            }
          ],
          responses: {
            200: {
              description: "Prompt list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Prompt" } },
                      pagination: {
                        $ref: "#/components/schemas/PromptListResponse/properties/pagination"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: "Create prompt",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PromptInput" } }
            }
          },
          responses: {
            201: {
              description: "Prompt created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Prompt" } }
                  }
                }
              }
            }
          }
        }
      },
      "/prompts/{promptId}": {
        get: {
          summary: "Retrieve prompt",
          parameters: [
            { name: "promptId", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            200: {
              description: "Prompt",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Prompt" } }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: "Update prompt",
          parameters: [
            { name: "promptId", in: "path", required: true, schema: { type: "string" } }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PromptInput" }
              }
            }
          },
          responses: {
            200: {
              description: "Updated prompt",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Prompt" } }
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: "Delete prompt",
          parameters: [
            { name: "promptId", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            204: { description: "Prompt deleted" }
          }
        }
      },
      "/prompts/bulk/create": {
        post: {
          summary: "Bulk create prompts",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    prompts: { type: "array", items: { $ref: "#/components/schemas/PromptInput" } }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "Bulk operation result" }
          }
        }
      },
      "/prompts/import": {
        post: {
          summary: "Import prompts",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    format: { type: "string", enum: ["json", "csv"] }
                  }
                }
              }
            }
          },
          responses: {
            202: { description: "Import accepted" }
          }
        }
      },
      "/templates/render": {
        post: {
          summary: "Render template",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["template", "variables", "tenantId"],
                  properties: {
                    tenantId: { type: "string" },
                    template: { type: "string" },
                    variables: { type: "object", additionalProperties: true }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "Rendered output" }
          }
        }
      },
      "/analytics/overview": {
        get: {
          summary: "Dashboard analytics",
          parameters: [
            { name: "range", in: "query", schema: { type: "integer", default: 14 } },
            { name: "tenantId", in: "query", schema: { type: "string" } }
          ],
          responses: {
            200: { description: "Analytics overview" }
          }
        }
      },
      "/openapi.json": {
        get: {
          summary: "OpenAPI definition",
          responses: {
            200: {
              description: "OpenAPI document",
              content: {
                "application/json": {
                  schema: { type: "object" }
                }
              }
            }
          }
        }
      }
    }
  };
}
