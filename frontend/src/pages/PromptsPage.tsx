import { useEffect, useRef, useState } from "react";
import PromptTable from "../components/PromptTable";
import PromptForm from "../components/PromptForm";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { AdvancedFilters, type FilterOptions } from "../components/ui/AdvancedFilters";
import { Modal, ConfirmDialog } from "../components/ui/Modal";
import { ErrorState, NoPromptsFound, NoSearchResults } from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/LoadingState";
import { createPrompt, deletePrompt, listPrompts, updatePrompt } from "../lib/api";
import type {
  Prompt,
  PromptInput,
  PromptListResponse,
  PromptQuery,
  SortField,
  SortOrder
} from "../types";
import PromptCollaborationPanel from "../components/PromptCollaborationPanel";

interface ToastApi {
  success: (message: string) => string;
  error: (message: string) => string;
  warning: (message: string) => string;
  info: (message: string) => string;
}

interface PromptsPageProps {
  tenantId: string;
  token: string;
  toast: ToastApi;
  createSignal: number;
}

const PAGE_SIZE = 20;

export default function PromptsPage({
  tenantId,
  token,
  toast,
  createSignal
}: PromptsPageProps): JSX.Element {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [pagination, setPagination] = useState<PromptListResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("updated_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [detailPrompt, setDetailPrompt] = useState<Prompt | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const createSignalRef = useRef(createSignal);
  const { success: showSuccess, error: showError, warning: showWarning } = toast;

  useEffect(() => {
    if (createSignalRef.current !== createSignal) {
      createSignalRef.current = createSignal;
      setEditingPrompt(null);
      setIsFormOpen(true);
    }
  }, [createSignal]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrompts() {
      setLoading(true);
      setError(null);
      try {
        // Convert FilterOptions to server-compatible format
        const serverFilters: Partial<PromptQuery> = {
          tenantId,
          search: debouncedSearch || undefined,
          sortBy,
          order,
          page,
          pageSize: PAGE_SIZE
        };

        // Add advanced filters
        if (filters.tags && filters.tags.length > 0) {
          serverFilters.tags = filters.tags;
        }

        if (filters.metadata && filters.metadata.length > 0) {
          serverFilters.metadataFilters = filters.metadata.filter((m) => m.key && m.value);
        }

        if (filters.archived !== undefined) {
          serverFilters.archived = filters.archived;
        }

        if (filters.owner) {
          serverFilters.createdBy = filters.owner;
        }

        if (filters.dateRange?.from) {
          serverFilters.dateFrom = new Date(filters.dateRange.from).toISOString();
        }

        if (filters.dateRange?.to) {
          // Add one day to include the entire "to" date
          const toDate = new Date(filters.dateRange.to);
          toDate.setDate(toDate.getDate() + 1);
          serverFilters.dateTo = toDate.toISOString();
        }

        const response = await listPrompts(serverFilters as PromptQuery, token || undefined);

        if (cancelled) return;

        let data = response.data;

        // Only apply client-side filtering for searchIn functionality (if search is used)
        if (filters.searchIn && filters.searchIn.length && debouncedSearch) {
          const lowered = debouncedSearch.toLowerCase();
          data = data.filter((prompt) => {
            return filters.searchIn?.some((field) => {
              if (field === "title") return prompt.title.toLowerCase().includes(lowered);
              if (field === "body") return prompt.body.toLowerCase().includes(lowered);
              if (field === "tags")
                return prompt.tags.some((tag) => tag.toLowerCase().includes(lowered));
              if (field === "metadata")
                return JSON.stringify(prompt.metadata ?? {})
                  .toLowerCase()
                  .includes(lowered);
              return false;
            });
          });
        }

        setPrompts(data);
        setPagination(response.pagination);

        const tagSet = new Set<string>();
        response.data.forEach((prompt) => {
          prompt.tags.forEach((tag) => tagSet.add(tag));
        });
        setAvailableTags(Array.from(tagSet).sort());
      } catch (fetchError) {
        if (cancelled) return;
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        setError(message || "Failed to load prompts");
        showError(`Unable to load prompts: ${message}`);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPrompts();

    return () => {
      cancelled = true;
    };
  }, [tenantId, sortBy, order, page, debouncedSearch, filters, token, reloadKey, showError]);

  const handleSort = (field: SortField) => {
    setPage(1);
    if (field === sortBy) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setOrder("desc");
  };

  const handleCreate = () => {
    setEditingPrompt(null);
    setIsFormOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  const handleDelete = (prompt: Prompt) => {
    setDeletingPrompt(prompt);
  };

  const handleView = (prompt: Prompt) => {
    setDetailPrompt(prompt);
    setDetailOpen(true);
  };

  const handleSubmit = async (values: PromptInput) => {
    setFormBusy(true);
    try {
      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, values, tenantId, token || undefined);
        showSuccess("Prompt updated");
      } else {
        await createPrompt(values, token || undefined);
        showSuccess("Prompt created");
      }
      setIsFormOpen(false);
      setEditingPrompt(null);
      // Refresh list
      setPage(1);
      setReloadKey((count) => count + 1);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : String(submitError);
      showError(`Unable to save prompt: ${message}`);
      throw submitError;
    } finally {
      setFormBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPrompt) return;
    try {
      await deletePrompt(deletingPrompt.id, tenantId, token || undefined);
      showWarning(`Prompt “${deletingPrompt.title}” deleted`);
      setDeletingPrompt(null);
      setReloadKey((count) => count + 1);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : String(deleteError);
      showError(`Unable to delete prompt: ${message}`);
    }
  };

  const paginationControls = pagination && pagination.totalPages > 1 && (
    <div className="prompt-pagination">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <span>
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
        disabled={page >= pagination.totalPages}
      >
        Next
      </Button>
    </div>
  );

  const showEmptyState = !loading && !error && prompts.length === 0;

  return (
    <div className="pm-prompts-page pm-stack pm-stack--lg">
      <div className="flex items-center justify-between flex-wrap gap-md">
        <div className="flex items-center gap-sm">
          <h2 className="page-title">Prompts</h2>
          <Badge tone="info">{prompts.length} results</Badge>
        </div>
        <div className="flex items-center gap-sm">
          <div className="prompt-search">
            <Input
              type="search"
              placeholder="Search prompts"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search prompts"
            />
          </div>
          <AdvancedFilters
            initialFilters={filters}
            availableTags={availableTags}
            onApply={(next) => {
              setFilters(next);
              setShowFilters(false);
              setPage(1);
              setReloadKey((count) => count + 1);
            }}
            onReset={() => {
              setFilters({});
              setShowFilters(false);
              setPage(1);
              setReloadKey((count) => count + 1);
            }}
            isOpen={showFilters}
            onToggle={() => setShowFilters((prev) => !prev)}
          />
          <Button onClick={handleCreate}>+ New Prompt</Button>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((count) => count + 1)} />
      ) : null}

      {loading ? (
        <SkeletonTable rows={PAGE_SIZE} />
      ) : showEmptyState ? (
        filters.search || debouncedSearch || (filters.tags && filters.tags.length) ? (
          <NoSearchResults
            onClearFilters={() => {
              setFilters({});
              setSearch("");
              setReloadKey((count) => count + 1);
            }}
          />
        ) : (
          <NoPromptsFound onCreatePrompt={handleCreate} />
        )
      ) : (
        <PromptTable
          prompts={prompts}
          loading={loading}
          sortBy={sortBy}
          order={order}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          deletingId={deletingPrompt?.id ?? null}
        />
      )}

      {paginationControls}

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          if (formBusy) return;
          setIsFormOpen(false);
          setEditingPrompt(null);
        }}
        title={editingPrompt ? "Edit Prompt" : "Create Prompt"}
        size="lg"
      >
        <PromptForm
          mode={editingPrompt ? "update" : "create"}
          initial={editingPrompt}
          tenantId={tenantId}
          onSubmit={async (values) => {
            await handleSubmit(values);
          }}
          busy={formBusy}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingPrompt)}
        onClose={() => setDeletingPrompt(null)}
        onConfirm={handleConfirmDelete}
        title="Delete prompt"
        message={
          deletingPrompt
            ? `Are you sure you want to delete “${deletingPrompt.title}”? This action cannot be undone.`
            : ""
        }
        variant="danger"
        confirmText="Delete"
      />

      <Modal
        isOpen={detailOpen && Boolean(detailPrompt)}
        onClose={() => {
          setDetailOpen(false);
          setDetailPrompt(null);
        }}
        title={detailPrompt ? detailPrompt.title : "Prompt details"}
        size="xl"
      >
        {detailPrompt ? (
          <PromptCollaborationPanel
            prompt={detailPrompt}
            tenantId={tenantId}
            token={token}
            toast={toast}
          />
        ) : null}
      </Modal>
    </div>
  );
}
