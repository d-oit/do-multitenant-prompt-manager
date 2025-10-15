/**
 * Monaco Editor Theme: "do-dark"
 * Professional dark theme for DO Multi-Tenant Prompt Manager
 * Based on VS Code Dark+ with custom color palette
 *
 * Color tokens synchronized with design-system/tokens.css
 */

import type { editor } from "monaco-editor";

export const monacoDoDarkTheme: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    // Keywords - Purple (#c586c0)
    { token: "keyword", foreground: "c586c0", fontStyle: "bold" },
    { token: "keyword.control", foreground: "c586c0", fontStyle: "bold" },
    { token: "keyword.operator", foreground: "c586c0" },

    // Strings - Orange (#ce9178)
    { token: "string", foreground: "ce9178" },
    { token: "string.quoted", foreground: "ce9178" },
    { token: "string.template", foreground: "ce9178" },

    // Numbers & Booleans - Light Green (#b5cea8)
    { token: "number", foreground: "b5cea8" },
    { token: "constant.numeric", foreground: "b5cea8" },
    { token: "constant.language.boolean", foreground: "b5cea8" },

    // Functions - Yellow (#dcdcaa)
    { token: "entity.name.function", foreground: "dcdcaa", fontStyle: "bold" },
    { token: "support.function", foreground: "dcdcaa" },
    { token: "meta.function-call", foreground: "dcdcaa" },

    // Variables & Parameters - Light Blue (#9cdcfe)
    { token: "variable", foreground: "9cdcfe" },
    { token: "variable.parameter", foreground: "9cdcfe" },
    { token: "variable.other", foreground: "9cdcfe" },
    { token: "meta.definition.variable", foreground: "9cdcfe" },

    // Comments - Green (#6a9955)
    { token: "comment", foreground: "6a9955", fontStyle: "italic" },
    { token: "comment.line", foreground: "6a9955", fontStyle: "italic" },
    { token: "comment.block", foreground: "6a9955", fontStyle: "italic" },

    // Operators - Light Gray (#d4d4d4)
    { token: "keyword.operator.arithmetic", foreground: "d4d4d4" },
    { token: "keyword.operator.assignment", foreground: "d4d4d4" },
    { token: "keyword.operator.comparison", foreground: "d4d4d4" },
    { token: "keyword.operator.logical", foreground: "d4d4d4" },

    // Types & Classes - Teal (#4ec9b0)
    { token: "entity.name.type", foreground: "4ec9b0", fontStyle: "bold" },
    { token: "entity.name.class", foreground: "4ec9b0", fontStyle: "bold" },
    { token: "support.type", foreground: "4ec9b0" },
    { token: "support.class", foreground: "4ec9b0" },
    { token: "storage.type", foreground: "4ec9b0" },

    // Constants - Bright Blue (#4fc1ff)
    { token: "constant", foreground: "4fc1ff" },
    { token: "constant.language", foreground: "4fc1ff" },
    { token: "variable.language", foreground: "4fc1ff" },

    // Properties - Light Blue (#9cdcfe)
    { token: "variable.property", foreground: "9cdcfe" },
    { token: "support.property", foreground: "9cdcfe" },
    { token: "meta.object-literal.key", foreground: "9cdcfe" },

    // HTML/JSX Tags - Blue (#569cd6)
    { token: "entity.name.tag", foreground: "569cd6", fontStyle: "bold" },
    { token: "meta.tag", foreground: "569cd6" },

    // HTML Attributes - Light Blue (#9cdcfe)
    { token: "entity.other.attribute-name", foreground: "9cdcfe" },

    // Delimiters - Gray (#808080)
    { token: "punctuation", foreground: "808080" },
    { token: "meta.brace", foreground: "808080" },
    { token: "punctuation.definition.bracket", foreground: "808080" },

    // JSON specific
    { token: "string.key.json", foreground: "9cdcfe" },
    { token: "string.value.json", foreground: "ce9178" },

    // Markdown
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },
    { token: "markup.heading", foreground: "569cd6", fontStyle: "bold" },
    { token: "markup.list", foreground: "c586c0" },
    { token: "markup.inline.raw", foreground: "ce9178" },
    { token: "markup.fenced_code", foreground: "b5cea8" },

    // Diff
    { token: "markup.inserted", foreground: "22c55e" },
    { token: "markup.deleted", foreground: "ef4444" },
    { token: "markup.changed", foreground: "f59e0b" }
  ],

  colors: {
    // Editor background
    "editor.background": "#0f172a", // slate-900
    "editor.foreground": "#f1f5f9", // slate-100

    // Line numbers and gutter
    "editorLineNumber.foreground": "#64748b", // slate-500
    "editorLineNumber.activeForeground": "#cbd5e1", // slate-300
    "editorGutter.background": "#0f172a",

    // Cursor
    "editorCursor.foreground": "#818cf8", // primary-400

    // Selection
    "editor.selectionBackground": "#6366f133", // primary-500 with 20% opacity
    "editor.inactiveSelectionBackground": "#6366f11a", // primary-500 with 10% opacity
    "editor.selectionHighlightBackground": "#6366f11a",

    // Current line highlight
    "editor.lineHighlightBackground": "#ffffff08", // Subtle white 3%
    "editor.lineHighlightBorder": "#00000000",

    // Find/Search
    "editor.findMatchBackground": "#fbbf2440", // warning-400 with opacity
    "editor.findMatchHighlightBackground": "#fbbf2420",
    "editor.findRangeHighlightBackground": "#6366f120",

    // Brackets
    "editorBracketMatch.background": "#6366f130",
    "editorBracketMatch.border": "#6366f180",

    // Indentation guides
    "editorIndentGuide.background": "#334155", // slate-700
    "editorIndentGuide.activeBackground": "#475569", // slate-600

    // Whitespace
    "editorWhitespace.foreground": "#334155",

    // Scrollbar
    "scrollbarSlider.background": "#47556940",
    "scrollbarSlider.hoverBackground": "#47556960",
    "scrollbarSlider.activeBackground": "#47556980",

    // Minimap
    "minimap.background": "#1e293b", // slate-800
    "minimap.selectionHighlight": "#6366f140",
    "minimap.findMatchHighlight": "#fbbf2440",

    // Widget (autocomplete, hover, etc.)
    "editorWidget.background": "#1e293b", // slate-800
    "editorWidget.border": "#334155", // slate-700
    "editorWidget.foreground": "#f1f5f9",

    // Suggest widget (autocomplete)
    "editorSuggestWidget.background": "#1e293b",
    "editorSuggestWidget.border": "#334155",
    "editorSuggestWidget.foreground": "#f1f5f9",
    "editorSuggestWidget.selectedBackground": "#334155",
    "editorSuggestWidget.highlightForeground": "#818cf8",

    // Hover widget
    "editorHoverWidget.background": "#1e293b",
    "editorHoverWidget.border": "#334155",
    "editorHoverWidget.foreground": "#f1f5f9",

    // Peek view (Go to definition)
    "peekView.border": "#6366f1",
    "peekViewEditor.background": "#1e293b",
    "peekViewEditor.matchHighlightBackground": "#fbbf2430",
    "peekViewResult.background": "#0f172a",
    "peekViewResult.selectionBackground": "#334155",
    "peekViewTitle.background": "#1e293b",
    "peekViewTitleDescription.foreground": "#94a3b8",
    "peekViewTitleLabel.foreground": "#f1f5f9",

    // Errors and warnings
    "editorError.foreground": "#ef4444", // error-500
    "editorWarning.foreground": "#f59e0b", // warning-500
    "editorInfo.foreground": "#3b82f6", // info-500
    "editorHint.foreground": "#22c55e", // success-500

    // Git decoration colors
    "gitDecoration.modifiedResourceForeground": "#f59e0b",
    "gitDecoration.deletedResourceForeground": "#ef4444",
    "gitDecoration.untrackedResourceForeground": "#22c55e",
    "gitDecoration.ignoredResourceForeground": "#64748b",
    "gitDecoration.conflictingResourceForeground": "#c586c0",

    // Diff editor
    "diffEditor.insertedTextBackground": "#22c55e20",
    "diffEditor.removedTextBackground": "#ef444420",
    "diffEditor.insertedLineBackground": "#22c55e10",
    "diffEditor.removedLineBackground": "#ef444410",

    // Merge conflicts
    "merge.currentHeaderBackground": "#6366f140",
    "merge.currentContentBackground": "#6366f120",
    "merge.incomingHeaderBackground": "#22c55e40",
    "merge.incomingContentBackground": "#22c55e20",
    "merge.border": "#334155",

    // Overview ruler (scrollbar area on the right)
    "editorOverviewRuler.border": "#00000000",
    "editorOverviewRuler.errorForeground": "#ef4444",
    "editorOverviewRuler.warningForeground": "#f59e0b",
    "editorOverviewRuler.infoForeground": "#3b82f6",
    "editorOverviewRuler.findMatchForeground": "#fbbf24",
    "editorOverviewRuler.selectionHighlightForeground": "#6366f180",

    // Folding
    "editorGutter.foldingControlForeground": "#94a3b8"
  }
};

export default monacoDoDarkTheme;
