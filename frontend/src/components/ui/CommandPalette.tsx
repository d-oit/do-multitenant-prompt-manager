/**
 * Command Palette Component
 * Modern command palette for quick navigation and actions
 */

import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../design-system/utils";
import Button from "./Button";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string[];
  action: () => void;
  category?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  placeholder?: string;
  maxResults?: number;
  className?: string;
  recentCommands?: string[];
  onRecentCommand?: (commandId: string) => void;
}

const CommandIcon = ({ children }: { children: ReactNode }) => (
  <div className="command-palette__command-icon">{children}</div>
);

const CommandShortcut = ({ keys }: { keys: string[] }) => (
  <div className="command-palette__shortcut">
    {keys.map((key, index) => (
      <span key={index} className="command-palette__shortcut-key">
        {key}
      </span>
    ))}
  </div>
);

export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(
  (
    {
      isOpen,
      onClose,
      commands,
      placeholder = "Type a command or search...",
      maxResults = 10,
      className,
      recentCommands = [],
      onRecentCommand
    },
    ref
  ) => {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter commands based on query
    useEffect(() => {
      if (!query.trim()) {
        // Show recent commands when no query
        const recent = recentCommands
          .map((id) => commands.find((cmd) => cmd.id === id))
          .filter(Boolean) as Command[];
        setFilteredCommands(recent.slice(0, maxResults));
        setSelectedIndex(0);
        return;
      }

      const queryLower = query.toLowerCase();
      const filtered = commands
        .filter((command) => {
          const searchText = [
            command.label,
            command.description,
            command.category,
            ...(command.keywords || [])
          ]
            .join(" ")
            .toLowerCase();

          return searchText.includes(queryLower);
        })
        .sort((a, b) => {
          // Prioritize exact matches
          const aExact = a.label.toLowerCase().startsWith(queryLower);
          const bExact = b.label.toLowerCase().startsWith(queryLower);

          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // Then prioritize by category
          if (a.category && !b.category) return -1;
          if (!a.category && b.category) return 1;

          return a.label.localeCompare(b.label);
        })
        .slice(0, maxResults);

      setFilteredCommands(filtered);
      setSelectedIndex(0);
    }, [query, commands, maxResults, recentCommands]);

    // Execute selected command
    const executeCommand = useCallback(
      (command: Command) => {
        command.action();
        onRecentCommand?.(command.id);
        onClose();
        setQuery("");
      },
      [onClose, onRecentCommand]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case "Escape":
            onClose();
            break;
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
            break;
          case "Enter":
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
              executeCommand(filteredCommands[selectedIndex]);
            }
            break;
          case "Tab":
            e.preventDefault();
            if (e.shiftKey) {
              setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else {
              setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
            }
            break;
        }
      },
      [filteredCommands, selectedIndex, executeCommand, onClose]
    );

    // Scroll selected item into view
    useEffect(() => {
      if (listRef.current) {
        const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth"
          });
        }
      }
    }, [selectedIndex]);

    // Focus input when opened
    useEffect(() => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen]);

    // Handle clicks outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref && "current" in ref && ref.current && !ref.current.contains(event.target as Node)) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen, onClose, ref]);

    // Group commands by category
    const groupedCommands = filteredCommands.reduce(
      (groups, command, index) => {
        const category = command.category || "Other";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push({ command, originalIndex: index });
        return groups;
      },
      {} as Record<string, Array<{ command: Command; originalIndex: number }>>
    );

    const handleOverlayKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
          onClose();
        }
      },
      [onClose]
    );

    if (!isOpen) return null;

    const commandPaletteContent = (
      <div
        className="command-palette__overlay"
        role="button"
        onMouseDown={onClose}
        onKeyDown={handleOverlayKeyDown}
        tabIndex={0}
        aria-label="Close command palette"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={ref}
          className={cn("command-palette", className)}
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onKeyDown={handleKeyDown as React.KeyboardEventHandler<HTMLDivElement>}
        >
          {/* Search Input */}
          <div className="command-palette__search">
            <div className="command-palette__search-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="command-palette__input"
              autoComplete="off"
              spellCheck="false"
              role="combobox"
              aria-expanded={filteredCommands.length > 0}
              aria-controls="command-palette-results"
              aria-activedescendant={filteredCommands[selectedIndex]?.id ?? undefined}
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery("")}
                className="command-palette__clear"
                aria-label="Clear search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            )}
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="command-palette__results"
            role="listbox"
            id="command-palette-results"
          >
            {filteredCommands.length === 0 ? (
              <div className="command-palette__empty">
                {query ? `No commands found for "${query}"` : "Type to search for commands..."}
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="command-palette__group">
                  {Object.keys(groupedCommands).length > 1 && (
                    <div className="command-palette__group-title">{category}</div>
                  )}
                  {items.map(({ command, originalIndex }) => (
                    <div
                      key={command.id}
                      className={cn(
                        "command-palette__command",
                        selectedIndex === originalIndex && "command-palette__command--selected"
                      )}
                      onClick={() => executeCommand(command)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          executeCommand(command);
                        }
                      }}
                      role="option"
                      aria-selected={selectedIndex === originalIndex}
                      tabIndex={selectedIndex === originalIndex ? 0 : -1}
                      id={command.id}
                    >
                      {command.icon && <CommandIcon>{command.icon}</CommandIcon>}
                      <div className="command-palette__command-content">
                        <div className="command-palette__command-label">{command.label}</div>
                        {command.description && (
                          <div className="command-palette__command-description">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && <CommandShortcut keys={command.shortcut} />}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="command-palette__footer">
            <div className="command-palette__hint">
              <span className="command-palette__hint-key">↑↓</span> Navigate
              <span className="command-palette__hint-key">↵</span> Select
              <span className="command-palette__hint-key">Esc</span> Close
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(commandPaletteContent, document.body);
  }
);

CommandPalette.displayName = "CommandPalette";

export default CommandPalette;
