/**
 * Advanced Filters Component (2025 Best Practices)
 * Comprehensive filtering with tags, date ranges, and custom options
 */

import { useState } from "react";
import { cn } from "../../design-system/utils";
import Button from "./Button";
import Input from "./Input";

interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
}

interface FilterSection {
  id: string;
  label: string;
  type: "tags" | "dateRange" | "select" | "multiSelect" | "search";
  options?: FilterOption[];
  placeholder?: string;
}

export interface FilterState {
  [key: string]: string | string[] | { start?: string; end?: string } | undefined;
}

interface AdvancedFiltersProps {
  sections: FilterSection[];
  value: FilterState;
  onChange: (filters: FilterState) => void;
  onApply?: () => void;
  onReset?: () => void;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export function AdvancedFilters({
  sections,
  value,
  onChange,
  onApply,
  onReset
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (
    sectionId: string,
    newValue: string | string[] | { start?: string; end?: string }
  ) => {
    onChange({
      ...value,
      [sectionId]: newValue
    });
  };

  const handleReset = () => {
    const emptyFilters: FilterState = {};
    sections.forEach((section) => {
      if (section.type === "multiSelect") {
        emptyFilters[section.id] = [];
      } else if (section.type === "dateRange") {
        emptyFilters[section.id] = {};
      } else {
        emptyFilters[section.id] = "";
      }
    });
    onChange(emptyFilters);
    onReset?.();
  };

  const activeFilterCount = Object.values(value).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return !!v;
  }).length;

  return (
    <div className="advanced-filters">
      <div className="advanced-filters__header">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<FilterIcon />}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="advanced-filters__badge">{activeFilterCount}</span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Clear all
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="advanced-filters__panel">
          <div className="advanced-filters__sections">
            {sections.map((section) => (
              <div key={section.id} className="advanced-filters__section">
                <label className="advanced-filters__section-label">{section.label}</label>

                {section.type === "search" && (
                  <div className="advanced-filters__search">
                    <SearchIcon />
                    <Input
                      type="text"
                      placeholder={section.placeholder || "Search..."}
                      value={(value[section.id] as string) || ""}
                      onChange={(e) => handleFilterChange(section.id, e.target.value)}
                    />
                  </div>
                )}

                {section.type === "select" && (
                  <select
                    className="advanced-filters__select"
                    value={(value[section.id] as string) || ""}
                    onChange={(e) => handleFilterChange(section.id, e.target.value)}
                  >
                    <option value="">All</option>
                    {section.options?.map((option) => (
                      <option key={option.id} value={option.value as string}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {section.type === "multiSelect" && (
                  <div className="advanced-filters__multi-select">
                    {section.options?.map((option) => (
                      <label key={option.id} className="advanced-filters__checkbox">
                        <input
                          type="checkbox"
                          checked={((value[section.id] as string[]) || []).includes(
                            option.value as string
                          )}
                          onChange={(e) => {
                            const currentValues = (value[section.id] as string[]) || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option.value as string]
                              : currentValues.filter((v) => v !== option.value);
                            handleFilterChange(section.id, newValues);
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {section.type === "tags" && (
                  <div className="advanced-filters__tags">
                    {section.options?.map((option) => {
                      const isActive = ((value[section.id] as string[]) || []).includes(
                        option.value as string
                      );
                      return (
                        <button
                          key={option.id}
                          className={cn(
                            "advanced-filters__tag",
                            isActive && "advanced-filters__tag--active"
                          )}
                          onClick={() => {
                            const currentValues = (value[section.id] as string[]) || [];
                            const newValues = isActive
                              ? currentValues.filter((v) => v !== option.value)
                              : [...currentValues, option.value as string];
                            handleFilterChange(section.id, newValues);
                          }}
                          type="button"
                        >
                          {option.label}
                          {isActive && (
                            <span className="advanced-filters__tag-close">
                              <CloseIcon />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {section.type === "dateRange" && (
                  <div className="advanced-filters__date-range">
                    <div className="advanced-filters__date-field">
                      <CalendarIcon />
                      <Input
                        type="date"
                        placeholder="Start date"
                        value={((value[section.id] as { start?: string }) || {}).start || ""}
                        onChange={(e) =>
                          handleFilterChange(section.id, {
                            ...((value[section.id] as { start?: string; end?: string }) || {}),
                            start: e.target.value
                          })
                        }
                      />
                    </div>
                    <span className="advanced-filters__date-separator">to</span>
                    <div className="advanced-filters__date-field">
                      <CalendarIcon />
                      <Input
                        type="date"
                        placeholder="End date"
                        value={((value[section.id] as { end?: string }) || {}).end || ""}
                        onChange={(e) =>
                          handleFilterChange(section.id, {
                            ...((value[section.id] as { start?: string; end?: string }) || {}),
                            end: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="advanced-filters__actions">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setIsOpen(false)}>
              Close
            </Button>
            {onApply && (
              <Button variant="primary" size="sm" fullWidth onClick={onApply}>
                Apply Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="advanced-filters__active">
          {Object.entries(value).map(([key, val]) => {
            const section = sections.find((s) => s.id === key);
            if (!section || !val) return null;

            if (Array.isArray(val) && val.length > 0) {
              return val.map((v) => {
                const option = section.options?.find((o) => o.value === v);
                return (
                  <button
                    key={`${key}-${v}`}
                    className="advanced-filters__active-tag"
                    onClick={() => {
                      const newValues = (value[key] as string[]).filter((item) => item !== v);
                      handleFilterChange(key, newValues);
                    }}
                    type="button"
                  >
                    {section.label}: {option?.label || v}
                    <CloseIcon />
                  </button>
                );
              });
            }

            if (typeof val === "object" && !Array.isArray(val)) {
              const dateRange = val as { start?: string; end?: string };
              if (dateRange.start || dateRange.end) {
                return (
                  <button
                    key={key}
                    className="advanced-filters__active-tag"
                    onClick={() => handleFilterChange(key, {})}
                    type="button"
                  >
                    {section.label}: {dateRange.start || "..."} - {dateRange.end || "..."}
                    <CloseIcon />
                  </button>
                );
              }
            }

            if (typeof val === "string" && val) {
              return (
                <button
                  key={key}
                  className="advanced-filters__active-tag"
                  onClick={() => handleFilterChange(key, "")}
                  type="button"
                >
                  {section.label}: {val}
                  <CloseIcon />
                </button>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

export default AdvancedFilters;
