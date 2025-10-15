import type { editor } from "monaco-editor";
import { useCallback, useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?:
    | "markdown"
    | "json"
    | "javascript"
    | "typescript"
    | "html"
    | "css"
    | "python"
    | "plaintext";
  height?: number | string;
  placeholder?: string;
  readOnly?: boolean;
  ariaLabel?: string;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
}

const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 14,
  wordWrap: "on",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  padding: { top: 12, bottom: 12 },
  lineNumbers: "off",
  renderLineHighlight: "all",
  scrollbar: {
    useShadows: false,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  renderValidationDecorations: "on",
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",
  tabCompletion: "on",
  formatOnPaste: true,
  formatOnType: true
};

export function RichTextEditor({
  value,
  onChange,
  language = "markdown",
  height = 320,
  placeholder,
  readOnly = false,
  ariaLabel,
  showLineNumbers = false,
  showMinimap = false
}: RichTextEditorProps): JSX.Element {
  const [theme, setTheme] = useState<"vs-light" | "vs-dark">("vs-light");

  // Detect system theme and theme changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark" ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setTheme(isDark ? "vs-dark" : "vs-light");
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });

    // Watch for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => updateTheme();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const options = useMemo(
    () => ({
      ...defaultOptions,
      readOnly,
      ariaLabel,
      lineNumbers: showLineNumbers ? ("on" as const) : ("off" as const),
      minimap: { enabled: showMinimap }
    }),
    [ariaLabel, readOnly, showLineNumbers, showMinimap]
  );

  const handleChange = useCallback(
    (content?: string | undefined) => {
      onChange(content ?? "");
    },
    [onChange]
  );

  return (
    <div className="rich-text-editor">
      <Editor
        value={value}
        defaultLanguage={language}
        onChange={handleChange}
        height={height}
        options={options}
        theme={theme}
        loading={
          <div style={{ padding: "12px", color: "var(--color-text-muted)" }}>Loading editor...</div>
        }
      />
      {placeholder && !value ? (
        <div className="rich-text-editor__placeholder">{placeholder}</div>
      ) : null}
    </div>
  );
}

export default RichTextEditor;
