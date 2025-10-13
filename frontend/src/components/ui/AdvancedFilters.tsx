/**
 * Advanced Filter Panel Component
 * Provides comprehensive filtering options for prompts
 */

import { useState } from 'react';

export interface FilterOptions {
  search?: string;
  searchIn?: Array<'title' | 'body' | 'tags' | 'metadata'>;
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  metadata?: Array<{
    key: string;
    operator: 'equals' | 'contains' | 'not_equals';
    value: string;
  }>;
  archived?: boolean;
  owner?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface AdvancedFiltersProps {
  initialFilters?: FilterOptions;
  availableTags?: string[];
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AdvancedFilters({
  initialFilters = {},
  availableTags = [],
  onApply,
  onReset,
  isOpen = false,
  onToggle,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleSearchInChange = (field: 'title' | 'body' | 'tags' | 'metadata') => {
    const current = filters.searchIn || ['title', 'body', 'tags'];
    if (current.includes(field)) {
      setFilters({
        ...filters,
        searchIn: current.filter((f) => f !== field),
      });
    } else {
      setFilters({
        ...filters,
        searchIn: [...current, field],
      });
    }
  };

  const handleTagToggle = (tag: string) => {
    const current = filters.tags || [];
    if (current.includes(tag)) {
      setFilters({
        ...filters,
        tags: current.filter((t) => t !== tag),
      });
    } else {
      setFilters({
        ...filters,
        tags: [...current, tag],
      });
    }
  };

  const handleAddMetadataFilter = () => {
    const current = filters.metadata || [];
    setFilters({
      ...filters,
      metadata: [
        ...current,
        { key: '', operator: 'equals', value: '' },
      ],
    });
  };

  const handleMetadataFilterChange = (
    index: number,
    field: 'key' | 'operator' | 'value',
    value: string
  ) => {
    const current = filters.metadata || [];
    const updated = [...current];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setFilters({ ...filters, metadata: updated });
  };

  const handleRemoveMetadataFilter = (index: number) => {
    const current = filters.metadata || [];
    setFilters({
      ...filters,
      metadata: current.filter((_, i) => i !== index),
    });
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const searchIn = filters.searchIn || ['title', 'body', 'tags'];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="btn btn-secondary btn-sm"
        type="button"
      >
        Advanced Filters
      </button>
    );
  }

  return (
    <div className="advanced-filters">
      <div className="advanced-filters__header">
        <h3 className="advanced-filters__title">Advanced Filters</h3>
        <button
          onClick={onToggle}
          className="btn btn-ghost btn-sm"
          aria-label="Close filters"
          type="button"
        >
          ×
        </button>
      </div>

      <div className="advanced-filters__content">
        {/* Search In */}
        <fieldset className="pm-field">
          <legend className="pm-field__label">Search in:</legend>
          <div className="flex flex-wrap gap-sm">
            {(['title', 'body', 'tags', 'metadata'] as const).map((field) => (
              <label key={field} className="pm-checkbox">
                <input
                  type="checkbox"
                  checked={searchIn.includes(field)}
                  onChange={() => handleSearchInChange(field)}
                />
                <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date Range */}
        <fieldset className="pm-field">
          <legend className="pm-field__label">Date Range:</legend>
          <div className="flex gap-md">
            <div className="flex-1">
              <label className="sr-only" htmlFor="advanced-filters-date-from">
                From date
              </label>
              <input
                id="advanced-filters-date-from"
                type="date"
                className="pm-input input-sm"
                value={filters.dateRange?.from || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      from: e.target.value,
                    },
                  })
                }
                placeholder="From"
              />
            </div>
            <div className="flex-1">
              <label className="sr-only" htmlFor="advanced-filters-date-to">
                To date
              </label>
              <input
                id="advanced-filters-date-to"
                type="date"
                className="pm-input input-sm"
                value={filters.dateRange?.to || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      to: e.target.value,
                    },
                  })
                }
                placeholder="To"
              />
            </div>
          </div>
        </fieldset>

        {/* Tags */}
        {availableTags.length > 0 && (
          <fieldset className="pm-field">
            <legend className="pm-field__label">Tags (Multi-select):</legend>
            <div className="flex flex-wrap gap-sm">
              {availableTags.map((tag) => (
                <label key={tag} className="pm-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.tags?.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Metadata Filters */}
        <fieldset className="pm-field">
          <legend className="pm-field__label">Metadata Filters:</legend>
          <div className="stack-sm">
            {(filters.metadata || []).map((filter, index) => (
              <div key={index} className="flex gap-sm items-end">
                <div className="flex-1">
                  <input
                    type="text"
                    className="pm-input input-sm"
                    value={filter.key}
                    onChange={(e) =>
                      handleMetadataFilterChange(index, 'key', e.target.value)
                    }
                    placeholder="Key"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <select
                    className="pm-select input-sm"
                    value={filter.operator}
                    onChange={(e) =>
                      handleMetadataFilterChange(index, 'operator', e.target.value)
                    }
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="not_equals">Not Equals</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    className="pm-input input-sm"
                    value={filter.value}
                    onChange={(e) =>
                      handleMetadataFilterChange(index, 'value', e.target.value)
                    }
                    placeholder="Value"
                  />
                </div>
                <button
                  onClick={() => handleRemoveMetadataFilter(index)}
                  className="btn btn-ghost btn-sm"
                  aria-label="Remove filter"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={handleAddMetadataFilter}
              className="btn btn-secondary btn-sm"
              type="button"
            >
              + Add Filter
            </button>
          </div>
        </fieldset>

        {/* Status */}
        <fieldset className="pm-field">
          <legend className="pm-field__label">Status:</legend>
          <div className="flex gap-md">
            <label className="pm-checkbox">
              <input
                type="radio"
                name="archived"
                checked={filters.archived === false || filters.archived === undefined}
                onChange={() => setFilters({ ...filters, archived: false })}
              />
              <span>Active</span>
            </label>
            <label className="pm-checkbox">
              <input
                type="radio"
                name="archived"
                checked={filters.archived === true}
                onChange={() => setFilters({ ...filters, archived: true })}
              />
              <span>Archived</span>
            </label>
          </div>
        </fieldset>

        {/* Sort */}
        <div className="pm-field">
          <label className="pm-field__label" htmlFor="advanced-filters-sort-by">
            Sort by:
          </label>
          <div className="flex gap-md">
            <select
              className="pm-select input-sm flex-1"
              id="advanced-filters-sort-by"
              value={filters.sortBy || 'created_at'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as FilterOptions['sortBy'],
                })
              }
            >
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
              <option value="title">Title</option>
            </select>
            <select
              className="pm-select input-sm"
              aria-label="Sort order"
              value={filters.sortOrder || 'desc'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortOrder: e.target.value as FilterOptions['sortOrder'],
                })
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="advanced-filters__footer">
        <button onClick={handleReset} className="btn btn-ghost" type="button">
          Reset
        </button>
        <button onClick={handleApply} className="btn btn-primary" type="button">
          Apply Filters
        </button>
      </div>
    </div>
  );
}
