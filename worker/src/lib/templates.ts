/**
 * Template Engine Module
 * Handles prompt templates with variable substitution
 */

import { z } from "zod";

// Template syntax: {{variable_name}} or {{variable_name:default_value}}
const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*(?::.*?)?)\}\}/g;

export interface TemplateVariable {
  name: string;
  defaultValue?: string;
  required: boolean;
}

export interface Template {
  content: string;
  variables: TemplateVariable[];
}

export interface RenderOptions {
  strict?: boolean; // If true, throw error on missing variables
  keepUnmatched?: boolean; // If true, keep unmatched variables in output
}

const RenderSchema = z.object({
  template: z.string(),
  variables: z.record(z.string(), z.unknown()),
  options: z
    .object({
      strict: z.boolean().optional(),
      keepUnmatched: z.boolean().optional()
    })
    .optional()
});

/**
 * Parse template and extract variables
 */
export function parseTemplate(content: string): Template {
  const variables: TemplateVariable[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = VARIABLE_REGEX.exec(content)) !== null) {
    const fullMatch = match[1];
    const parts = fullMatch.split(":");
    const name = parts[0];
    const defaultValue = parts.length > 1 ? parts.slice(1).join(":") : undefined;

    if (!seen.has(name)) {
      variables.push({
        name,
        defaultValue,
        required: defaultValue === undefined
      });
      seen.add(name);
    }
  }

  // Reset regex state
  VARIABLE_REGEX.lastIndex = 0;

  return {
    content,
    variables
  };
}

/**
 * Render template with variable substitution
 */
export function renderTemplate(
  template: string,
  variables: Record<string, unknown>,
  options: RenderOptions = {}
): string {
  const { strict = false, keepUnmatched = false } = options;
  const parsedTemplate = parseTemplate(template);

  // Validate required variables
  if (strict) {
    const missingRequired = parsedTemplate.variables
      .filter((v) => v.required && !(v.name in variables))
      .map((v) => v.name);

    if (missingRequired.length > 0) {
      throw new Error(`Missing required variables: ${missingRequired.join(", ")}`);
    }
  }

  // Replace variables
  let result = template;

  VARIABLE_REGEX.lastIndex = 0;
  result = result.replace(VARIABLE_REGEX, (match, fullMatch) => {
    const parts = fullMatch.split(":");
    const name = parts[0];
    const defaultValue = parts.length > 1 ? parts.slice(1).join(":") : undefined;

    if (name in variables) {
      const value = variables[name];
      return value !== null && value !== undefined ? String(value) : "";
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (keepUnmatched) {
      return match;
    }

    return "";
  });

  return result;
}

/**
 * Validate template data
 */
export function validateRenderRequest(data: unknown) {
  return RenderSchema.parse(data);
}

/**
 * Extract all variable names from template
 */
export function extractVariableNames(template: string): string[] {
  const parsed = parseTemplate(template);
  return parsed.variables.map((v) => v.name);
}

/**
 * Check if template is valid
 */
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Check for unclosed variables
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push("Unmatched template braces");
    }

    // Check for invalid variable names
    VARIABLE_REGEX.lastIndex = 0;
    let match;
    while ((match = VARIABLE_REGEX.exec(template)) !== null) {
      const varName = match[1].split(":")[0];
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
        errors.push(`Invalid variable name: ${varName}`);
      }
    }
    VARIABLE_REGEX.lastIndex = 0;

    // Check for nested variables
    if (/\{\{.*\{\{.*\}\}.*\}\}/.test(template)) {
      errors.push("Nested variables are not supported");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get template suggestions based on cursor position
 */
export function getTemplateSuggestions(
  template: string,
  cursorPosition: number,
  availableVariables: string[]
): string[] {
  // Check if cursor is inside {{ }}
  const beforeCursor = template.slice(0, cursorPosition);
  const afterCursor = template.slice(cursorPosition);

  const lastOpenBrace = beforeCursor.lastIndexOf("{{");
  const lastCloseBrace = beforeCursor.lastIndexOf("}}");
  const nextCloseBrace = afterCursor.indexOf("}}");

  // Cursor is inside a variable placeholder
  if (lastOpenBrace > lastCloseBrace && (nextCloseBrace >= 0 || afterCursor.startsWith("}"))) {
    const variableStart = lastOpenBrace + 2;
    const partial = beforeCursor.slice(variableStart).toLowerCase();

    return availableVariables.filter((v) => v.toLowerCase().startsWith(partial));
  }

  return [];
}

/**
 * Template library - predefined templates
 */
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  tags: string[];
}

export const TEMPLATE_LIBRARY: TemplateDefinition[] = [
  {
    id: "customer-support-email",
    name: "Customer Support Email",
    description: "Professional customer support email template",
    category: "Support",
    template: `Dear {{customer_name}},

Thank you for contacting us regarding {{issue_type}}.

{{#if resolution_provided}}
{{resolution_details}}

We hope this resolves your concern.
{{else}}
We are currently investigating your issue and will get back to you within {{response_time:24 hours}}.
{{/if}}

If you have any further questions, please don't hesitate to reach out.

Best regards,
{{agent_name}}
{{company_name}} Support Team`,
    tags: ["support", "email", "customer-service"]
  },
  {
    id: "code-review",
    name: "Code Review Prompt",
    description: "Comprehensive code review with best practices",
    category: "Development",
    template: `Review the following {{language:code}} for:

1. Code quality and readability
2. Performance optimization opportunities
3. Security vulnerabilities
4. Best practices and design patterns
5. {{additional_focus:Edge cases and error handling}}

Code:
\`\`\`
{{code}}
\`\`\`

{{#if context}}
Context: {{context}}
{{/if}}

Please provide specific recommendations with code examples where applicable.`,
    tags: ["code", "review", "development"]
  },
  {
    id: "content-generator",
    name: "Content Generator",
    description: "SEO-optimized content generation",
    category: "Content",
    template: `Generate {{content_type:blog post}} about: {{topic}}

Target audience: {{audience:general}}
Tone: {{tone:professional and engaging}}
Length: {{length:800-1000 words}}

{{#if keywords}}
Include these keywords: {{keywords}}
{{/if}}

{{#if structure}}
Follow this structure:
{{structure}}
{{/if}}

Requirements:
- SEO-optimized
- Include relevant examples
- Add actionable takeaways
- {{custom_requirements}}`,
    tags: ["content", "seo", "writing"]
  }
];

/**
 * Get template from library by ID
 */
export function getTemplateFromLibrary(id: string): TemplateDefinition | null {
  return TEMPLATE_LIBRARY.find((t) => t.id === id) || null;
}

/**
 * Search templates in library
 */
export function searchTemplateLibrary(query: string): TemplateDefinition[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATE_LIBRARY.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  return TEMPLATE_LIBRARY.filter((t) => t.category.toLowerCase() === category.toLowerCase());
}

/**
 * Preview template with sample data
 */
export function previewTemplate(template: string, sampleData?: Record<string, unknown>): string {
  const parsed = parseTemplate(template);

  // Generate sample data for all variables if not provided
  const data = sampleData || {};
  for (const variable of parsed.variables) {
    if (!(variable.name in data)) {
      data[variable.name] = variable.defaultValue || `[${variable.name}]`;
    }
  }

  return renderTemplate(template, data, { keepUnmatched: false });
}
