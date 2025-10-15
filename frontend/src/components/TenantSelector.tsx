import { useId, useMemo, useState } from "react";
import type { Tenant, TenantCreateInput } from "../types";
import Field from "./ui/Field";
import Select from "./ui/Select";
import Input from "./ui/Input";
import Button from "./ui/Button";

interface TenantSelectorProps {
  tenants: Tenant[];
  selectedTenantId: string;
  onSelect: (tenantId: string) => void;
  onCreateTenant: (input: TenantCreateInput) => Promise<void>;
  busy?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
}

export default function TenantSelector({
  tenants,
  selectedTenantId,
  onSelect,
  onCreateTenant,
  busy = false
}: TenantSelectorProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const sortedTenants = useMemo(
    () => [...tenants].sort((a, b) => a.name.localeCompare(b.name)),
    [tenants]
  );

  const resetForm = () => {
    setName("");
    setSlug("");
    setError(null);
    setSubmitting(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(slugify(value));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const input: TenantCreateInput = {
      name: name.trim(),
      slug: slug ? slug : slugify(name)
    };

    setSubmitting(true);
    setError(null);
    try {
      await onCreateTenant(input);
      resetForm();
      setExpanded(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : String(createError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tenant-selector">
      <Field label="Tenant" htmlFor={`${formId}-tenant`}>
        <Select
          id={`${formId}-tenant`}
          value={selectedTenantId}
          onChange={(event) => onSelect(event.target.value)}
          disabled={busy}
        >
          {sortedTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.slug})
            </option>
          ))}
        </Select>
      </Field>
      <details
        className="tenant-create"
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary>Create tenant</summary>
        <div className="tenant-create-form">
          <Field label="Name" htmlFor={`${formId}-tenant-name`}>
            <Input
              id={`${formId}-tenant-name`}
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Team or client name"
              disabled={submitting}
            />
          </Field>
          <Field
            label="Slug"
            htmlFor={`${formId}-tenant-slug`}
            description="Defaults to a URL-safe version of the name"
          >
            <Input
              id={`${formId}-tenant-slug`}
              type="text"
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="url-friendly"
              disabled={submitting}
            />
          </Field>
          {error ? <div className="pm-alert pm-alert--error">{error}</div> : null}
          <div className="tenant-create-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setExpanded(false);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
