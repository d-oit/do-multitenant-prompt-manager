/**
 * Keyboard Shortcuts System
 * Global keyboard shortcuts and help panel
 */

import { useEffect, useState } from "react";
import { Modal } from "./Modal";

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
  category?: string;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? "⌘" : "Ctrl";

// Default shortcuts
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    keys: ["?"],
    description: "Show keyboard shortcuts",
    action: () => {},
    category: "General"
  },
  {
    keys: [modKey, "K"],
    description: "Open search",
    action: () => {},
    category: "General"
  },
  {
    keys: [modKey, "N"],
    description: "New prompt",
    action: () => {},
    category: "General"
  },
  {
    keys: [modKey, "S"],
    description: "Save current",
    action: () => {},
    category: "General"
  },
  {
    keys: ["Esc"],
    description: "Close modal/panel",
    action: () => {},
    category: "General"
  },
  {
    keys: ["G", "D"],
    description: "Go to Dashboard",
    action: () => {},
    category: "Navigation"
  },
  {
    keys: ["G", "P"],
    description: "Go to Prompts",
    action: () => {},
    category: "Navigation"
  },
  {
    keys: ["J"],
    description: "Next item",
    action: () => {},
    category: "Navigation"
  },
  {
    keys: ["K"],
    description: "Previous item",
    action: () => {},
    category: "Navigation"
  }
];

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);
  const [sequenceBuffer, setSequenceBuffer] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Build key combination string
      let keyCombination = "";
      if (ctrl) keyCombination += modKey + "+";
      if (shift) keyCombination += "Shift+";
      if (alt) keyCombination += "Alt+";
      keyCombination += key;

      // Check for matches
      for (const shortcut of shortcuts) {
        if (shortcut.keys.length === 1) {
          // Single key shortcut
          if (keyCombination === shortcut.keys[0]) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        } else {
          // Sequence shortcut (e.g., G then D)
          const newBuffer = [...sequenceBuffer, key];
          const bufferString = newBuffer.join("+");

          if (shortcut.keys.join("+") === bufferString) {
            e.preventDefault();
            shortcut.action();
            setSequenceBuffer([]);
            return;
          }

          // Partial match, keep building sequence
          if (shortcut.keys.join("+").startsWith(bufferString)) {
            setSequenceBuffer(newBuffer);

            // Clear buffer after 1 second
            setTimeout(() => {
              setSequenceBuffer([]);
            }, 1000);
            return;
          }
        }
      }

      // Special case: ? key shows help
      if (key === "?" && !ctrl && !shift && !alt) {
        e.preventDefault();
        setShowHelp(true);
      }

      // No match, clear buffer
      if (sequenceBuffer.length > 0) {
        setSequenceBuffer([]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled, sequenceBuffer]);

  return {
    showHelp,
    setShowHelp
  };
}

// Keyboard shortcuts help panel
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts = defaultShortcuts
}: {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="keyboard-shortcuts">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} className="keyboard-shortcuts__category">
            <h3 className="keyboard-shortcuts__category-title">{category}</h3>
            <div className="keyboard-shortcuts__list">
              {categoryShortcuts.map((shortcut, index) => (
                <div key={index} className="keyboard-shortcuts__item">
                  <span className="keyboard-shortcuts__description">{shortcut.description}</span>
                  <div className="keyboard-shortcuts__keys">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex}>
                        <kbd className="keyboard-shortcuts__key">{key}</kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="keyboard-shortcuts__separator">then</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// Example usage component
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const shortcuts: KeyboardShortcut[] = [
    ...defaultShortcuts
    // Add app-specific shortcuts
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    shortcuts: shortcuts.map((s) => ({
      ...s,
      action: s.keys[0] === "?" ? () => setShowHelp(true) : s.action
    }))
  });

  return (
    <>
      {children}
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </>
  );
}
