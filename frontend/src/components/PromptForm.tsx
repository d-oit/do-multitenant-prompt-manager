import type { ChangeEvent, FormEvent } from "react";
import { lazy, Suspense, useEffect, useId, useState } from "react";
import { logError } from "../lib/logger";
import type { Prompt, PromptInput } from "../types";
import { serializeMetadata } from "../lib/api";
import Field from "./ui/Field";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Checkbox from "./ui/Checkbox";
import Button from "./ui/Button";

// Lazy load Monaco editor for better performance
const RichTextEditor = lazy(() => import("./RichTextEditor").then((module) => ({ default: module.RichTextEditor })));

interface PromptFormProps {
  mode: "create" | "update";
  initial?: Prompt | null;
  tenantId: string;
  onSubmit: (values: PromptInput) => Promise<void>;
  busy?: boolean;
  error?: string | null;
}

interface FormState {
  title: string;
  body: string;
  tags: string;
  metadata: string;
  createdBy: string;
  archived: boolean;
}

const emptyState: FormState = {
  title: "",
  body: "",
  tags: "",
  metadata: "",
  createdBy: "",
  archived: false
};

function deriveState(initial?: Prompt | null): FormState {
  if (!initial) return emptyState;
  return {
    title: initial.title,
    body: initial.body,
    tags: initial.tags.join(", "),
    metadata: serializeMetadata(initial.metadata),
    createdBy: initial.createdBy ?? "",
    archived: Boolean(initial.archived)
  };
}

export default function PromptForm({
  mode,
  initial,
  tenantId,
  onSubmit,
  busy = false,
  error
}: PromptFormProps): JSX.Element {
  const [values, setValues] = useState<FormState>(() => deriveState(initial));
  const [localError, setLocalError] = useState<string | null>(null);
  const fieldId = useId();

  useEffect(() => {
    setValues(deriveState(initial));
    setLocalError(null);
  }, [initial, mode]);

  useEffect(() => {
    if (!error) {
      setLocalError(null);
      return;
    }
    setLocalError(error);
  }, [error]);

  const handleChange = (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (localError) setLocalError(null);
    };

  const handleBodyChange = (content: string) => {
    setValues((prev) => ({ ...prev, body: content }));
    if (localError) setLocalError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    try {
      const metadata = values.metadata.trim()
        ? (JSON.parse(values.metadata) as Record<string, unknown>)
        : null;

      const payload: PromptInput = {
        tenantId,
        title: values.title.trim(),
        body: values.body.trim(),
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        metadata,
        archived: values.archived
      };

      if (!payload.metadata) {
        payload.metadata = null;
      }

      if (values.createdBy.trim()) {
        payload.createdBy = values.createdBy.trim();
      }

      if (!payload.title || !payload.body) {
        setLocalError("Title and body are required");
        return;
      }

      await onSubmit(payload);

      if (mode === "create") {
        setValues(emptyState);
      }
    } catch (submitError) {
      if (submitError instanceof SyntaxError) {
        logError("prompt.form.metadata", submitError, { mode });
        setLocalError("Metadata must be valid JSON");
      } else if (submitError instanceof Error) {
        setLocalError(submitError.message);
      } else {
        setLocalError(String(submitError));
      }
    }
  };

  const message = localError || error;

  return (
    <form className="pm-stack" onSubmit={handleSubmit} noValidate>
      <Field label="Title" htmlFor={`${fieldId}-title`}>
        <Input
          id={`${fieldId}-title`}
          type="text"
          value={values.title}
          onChange={handleChange("title")}
          placeholder="Summarize the prompt"
          required
        />
      </Field>
      <Field label="Body">
        <Suspense fallback={<div style={{ padding: "12px", color: "var(--pm-color-text-muted)" }}>Loading editor...</div>}>
          <RichTextEditor
            value={values.body}
            onChange={handleBodyChange}
            placeholder="Full prompt contents"
            ariaLabel="Body"
          />
        </Suspense>
      </Field>
      <Field label="Tags" htmlFor={`${fieldId}-tags`} description="Comma separated list">
        <Input
          id={`${fieldId}-tags`}
          type="text"
          value={values.tags}
          onChange={handleChange("tags")}
          placeholder="e.g. onboarding, support"
        />
      </Field>
      <Field
        label="Metadata (JSON)"
        htmlFor={`${fieldId}-metadata`}
        description="Provide key/value pairs to enrich prompt usage analytics"
      >
        <Textarea
          id={`${fieldId}-metadata`}
          value={values.metadata}
          onChange={handleChange("metadata")}
          rows={4}
          placeholder='{"category":"demo"}'
        />
      </Field>
      <Field label="Created by" htmlFor={`${fieldId}-created-by`}>
        <Input
          id={`${fieldId}-created-by`}
          type="text"
          value={values.createdBy}
          onChange={handleChange("createdBy")}
          placeholder="Optional owner identifier"
        />
      </Field>
      <Checkbox
        label="Archived"
        checked={values.archived}
        onChange={(event) =>
          setValues((prev) => ({ ...prev, archived: event.currentTarget.checked }))
        }
      />
      {message ? <div className="pm-alert pm-alert--error">{message}</div> : null}
      <div className="pm-form-footer">
        <Button type="submit" variant="primary" fullWidth disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Create" : "Update"}
        </Button>
      </div>
    </form>
  );
}
