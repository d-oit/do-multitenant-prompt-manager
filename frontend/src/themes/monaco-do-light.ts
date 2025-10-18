/**
 * Monaco Editor Theme: "do-light"
 * Professional light theme for d.o. Prompt Manager
 * Based on VS Code Light+ with custom color palette
 *
 * Color tokens synchronized with design-system/tokens.css
 */

import type { editor } from "monaco-editor";

export const monacoDoLightTheme: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    // Keywords - Purple (darker for light mode)
    { token: "keyword", foreground: "9d4edd", fontStyle: "bold" },
    { token: "keyword.control", foreground: "9d4edd", fontStyle: "bold" },
    { token: "keyword.operator", foreground: "9d4edd" },

    // Strings - Brown/Orange
    { token: "string", foreground: "a86700" },
    { token: "string.quoted", foreground: "a86700" },
    { token: "string.template", foreground: "a86700" },

    // Numbers & Booleans - Green
    { token: "number", foreground: "098658" },
    { token: "constant.numeric", foreground: "098658" },
    { token: "constant.language.boolean", foreground: "098658" },

    // Functions - Dark Yellow/Brown
    { token: "entity.name.function", foreground: "795e26", fontStyle: "bold" },
    { token: "support.function", foreground: "795e26" },
    { token: "meta.function-call", foreground: "795e26" },

    // Variables & Parameters - Blue
    { token: "variable", foreground: "001080" },
    { token: "variable.parameter", foreground: "001080" },
    { token: "variable.other", foreground: "001080" },
    { token: "meta.definition.variable", foreground: "001080" },

    // Comments - Green
    { token: "comment", foreground: "008000", fontStyle: "italic" },
    { token: "comment.line", foreground: "008000", fontStyle: "italic" },
    { token: "comment.block", foreground: "008000", fontStyle: "italic" },

    // Operators - Dark Gray
    { token: "keyword.operator.arithmetic", foreground: "000000" },
    { token: "keyword.operator.assignment", foreground: "000000" },
    { token: "keyword.operator.comparison", foreground: "000000" },
    { token: "keyword.operator.logical", foreground: "000000" },

    // Types & Classes - Teal
    { token: "entity.name.type", foreground: "267f99", fontStyle: "bold" },
    { token: "entity.name.class", foreground: "267f99", fontStyle: "bold" },
    { token: "support.type", foreground: "267f99" },
    { token: "support.class", foreground: "267f99" },
    { token: "storage.type", foreground: "267f99" },

    // Constants - Blue
    { token: "constant", foreground: "0070c1" },
    { token: "constant.language", foreground: "0070c1" },
    { token: "variable.language", foreground: "0070c1" },

    // Properties - Blue
    { token: "variable.property", foreground: "001080" },
    { token: "support.property", foreground: "001080" },
    { token: "meta.object-literal.key", foreground: "001080" },

    // HTML/JSX Tags - Dark Blue
    { token: "entity.name.tag", foreground: "800000", fontStyle: "bold" },
    { token: "meta.tag", foreground: "800000" },

    // HTML Attributes - Red
    { token: "entity.other.attribute-name", foreground: "ff0000" },

    // Delimiters - Dark Gray
    { token: "punctuation", foreground: "000000" },
    { token: "meta.brace", foreground: "000000" },
    { token: "punctuation.definition.bracket", foreground: "000000" },

    // JSON specific
    { token: "string.key.json", foreground: "0451a5" },
    { token: "string.value.json", foreground: "a31515" },

    // Markdown
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },
    { token: "markup.heading", foreground: "800000", fontStyle: "bold" },
    { token: "markup.list", foreground: "9d4edd" },
    { token: "markup.inline.raw", foreground: "a86700" },
    { token: "markup.fenced_code", foreground: "098658" },

    // Diff
    { token: "markup.inserted", foreground: "098658" },
    { token: "markup.deleted", foreground: "a31515" },
    { token: "markup.changed", foreground: "a86700" }
  ],

  colors: {
    // Editor background
    "editor.background": "#ffffff",
    "editor.foreground": "#000000",

    // Line numbers and gutter
    "editorLineNumber.foreground": "#64748b", // slate-500
    "editorLineNumber.activeForeground": "#334155", // slate-700
    "editorGutter.background": "#ffffff",

    // Cursor
    "editorCursor.foreground": "#4f46e5", // primary-600

    // Selection
    "editor.selectionBackground": "#6366f140", // primary-500 with opacity
    "editor.inactiveSelectionBackground": "#6366f120",
    "editor.selectionHighlightBackground": "#6366f120",

    // Current line highlight
    "editor.lineHighlightBackground": "#f8fafc", // slate-50
    "editor.lineHighlightBorder": "#00000000",

    // Find/Search
    "editor.findMatchBackground": "#fbbf2460",
    "editor.findMatchHighlightBackground": "#fbbf2430",
    "editor.findRangeHighlightBackground": "#6366f130",

    // Brackets
    "editorBracketMatch.background": "#6366f130",
    "editorBracketMatch.border": "#6366f1",

    // Indentation guides
    "editorIndentGuide.background": "#e2e8f0", // slate-200
    "editorIndentGuide.activeBackground": "#cbd5e1", // slate-300

    // Whitespace
    "editorWhitespace.foreground": "#cbd5e1",

    // Scrollbar
    "scrollbarSlider.background": "#cbd5e140",
    "scrollbarSlider.hoverBackground": "#cbd5e160",
    "scrollbarSlider.activeBackground": "#cbd5e180",

    // Minimap
    "minimap.background": "#f8fafc", // slate-50
    "minimap.selectionHighlight": "#6366f150",
    "minimap.findMatchHighlight": "#fbbf2450",

    // Widget (autocomplete, hover, etc.)
    "editorWidget.background": "#ffffff",
    "editorWidget.border": "#e2e8f0", // slate-200
    "editorWidget.foreground": "#000000",

    // Suggest widget
    "editorSuggestWidget.background": "#ffffff",
    "editorSuggestWidget.border": "#e2e8f0",
    "editorSuggestWidget.foreground": "#000000",
    "editorSuggestWidget.selectedBackground": "#f1f5f9", // slate-100
    "editorSuggestWidget.highlightForeground": "#4f46e5", // primary-600

    // Hover widget
    "editorHoverWidget.background": "#ffffff",
    "editorHoverWidget.border": "#e2e8f0",
    "editorHoverWidget.foreground": "#000000",

    // Peek view
    "peekView.border": "#6366f1",
    "peekViewEditor.background": "#f8fafc",
    "peekViewEditor.matchHighlightBackground": "#fbbf2440",
    "peekViewResult.background": "#ffffff",
    "peekViewResult.selectionBackground": "#f1f5f9",
    "peekViewTitle.background": "#f8fafc",
    "peekViewTitleDescription.foreground": "#64748b",
    "peekViewTitleLabel.foreground": "#000000",

    // Errors and warnings
    "editorError.foreground": "#dc2626", // error-600
    "editorWarning.foreground": "#d97706", // warning-600
    "editorInfo.foreground": "#2563eb", // info-600
    "editorHint.foreground": "#16a34a", // success-600

    // Git decoration colors
    "gitDecoration.modifiedResourceForeground": "#d97706",
    "gitDecoration.deletedResourceForeground": "#dc2626",
    "gitDecoration.untrackedResourceForeground": "#16a34a",
    "gitDecoration.ignoredResourceForeground": "#94a3b8",
    "gitDecoration.conflictingResourceForeground": "#9d4edd",

    // Diff editor
    "diffEditor.insertedTextBackground": "#16a34a30",
    "diffEditor.removedTextBackground": "#dc262630",
    "diffEditor.insertedLineBackground": "#16a34a20",
    "diffEditor.removedLineBackground": "#dc262620",

    // Merge conflicts
    "merge.currentHeaderBackground": "#6366f150",
    "merge.currentContentBackground": "#6366f130",
    "merge.incomingHeaderBackground": "#16a34a50",
    "merge.incomingContentBackground": "#16a34a30",
    "merge.border": "#e2e8f0",

    // Overview ruler
    "editorOverviewRuler.border": "#00000000",
    "editorOverviewRuler.errorForeground": "#dc2626",
    "editorOverviewRuler.warningForeground": "#d97706",
    "editorOverviewRuler.infoForeground": "#2563eb",
    "editorOverviewRuler.findMatchForeground": "#fbbf24",
    "editorOverviewRuler.selectionHighlightForeground": "#6366f180",

    // Folding
    "editorGutter.foldingControlForeground": "#64748b"
  }
};

export default monacoDoLightTheme;
