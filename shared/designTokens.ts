export const colorScale = {
  primary: {
    50: "#E6F0FF",
    100: "#CCE1FF",
    200: "#99C3FF",
    300: "#66A5FF",
    400: "#3387FF",
    500: "#0066FF",
    600: "#0052CC",
    700: "#003D99",
    800: "#002966",
    900: "#001433"
  },
  plum: {
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA"
  },
  neutral: {
    0: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A"
  },
  support: {
    success: "#10B981",
    successStrong: "#047857",
    warning: "#F59E0B",
    warningStrong: "#B45309",
    danger: "#EF4444",
    dangerStrong: "#B91C1C",
    info: "#3B82F6",
    infoStrong: "#1D4ED8"
  }
} as const;

export const typographyScale = {
  family: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    mono: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    xxl: "1.5rem",
    displaySm: "2rem",
    displayLg: "2.5rem"
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625
  }
} as const;

export const spacingScale = {
  none: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem"
} as const;

export const radii = {
  none: "0",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
  pill: "999px"
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(15, 23, 42, 0.15)",
  md: "0 8px 16px rgba(15, 23, 42, 0.15)",
  lg: "0 20px 45px rgba(15, 23, 42, 0.25)",
  focusPrimary: `0 0 0 3px ${colorScale.primary[100]}`,
  focusDanger: `0 0 0 3px ${colorScale.support.danger}22`
} as const;

export const breakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px"
} as const;

export const layout = {
  contentMaxWidth: "1200px",
  sidebarWidth: "320px",
  gutter: spacingScale[6]
} as const;

export const semanticLight = {
  surface: colorScale.neutral[0],
  surfaceAlt: colorScale.neutral[100],
  surfaceAccent: colorScale.neutral[200],
  background: colorScale.neutral[50],
  text: colorScale.neutral[900],
  textMuted: colorScale.neutral[600],
  border: colorScale.neutral[200],
  borderStrong: colorScale.neutral[300],
  accent: colorScale.plum[500],
  accentStrong: colorScale.plum[600],
  danger: colorScale.support.danger,
  success: colorScale.support.success,
  info: colorScale.support.info
} as const;

export const semanticDark = {
  surface: colorScale.neutral[800],
  surfaceAlt: colorScale.neutral[700],
  surfaceAccent: colorScale.neutral[600],
  background: colorScale.neutral[900],
  text: colorScale.neutral[50],
  textMuted: colorScale.neutral[300],
  border: "rgba(148, 163, 184, 0.25)",
  borderStrong: "rgba(148, 163, 184, 0.35)",
  accent: colorScale.plum[400],
  accentStrong: colorScale.plum[500],
  danger: colorScale.support.danger,
  success: colorScale.support.success,
  info: colorScale.support.info
} as const;

export const designThemes = {
  light: semanticLight,
  dark: semanticDark
} as const;

export type DesignThemeName = keyof typeof designThemes;

export const designTokens = {
  colorScale,
  typography: typographyScale,
  spacing: spacingScale,
  radii,
  shadows,
  layout,
  themes: designThemes,
  breakpoints
} as const;

export type DesignTokens = typeof designTokens;

export type ThemeTokens = (typeof designThemes)[DesignThemeName];

export function resolveTheme(name: DesignThemeName): ThemeTokens {
  return designThemes[name];
}

export function themeToCssVariables(name: DesignThemeName): Record<string, string> {
  const theme = resolveTheme(name);
  return {
    "--pm-color-surface": theme.surface,
    "--pm-color-surface-alt": theme.surfaceAlt,
    "--pm-color-surface-accent": theme.surfaceAccent,
    "--pm-color-background": theme.background,
    "--pm-color-text": theme.text,
    "--pm-color-text-muted": theme.textMuted,
    "--pm-color-border": theme.border,
    "--pm-color-border-strong": theme.borderStrong,
    "--pm-color-accent": theme.accent,
    "--pm-color-accent-strong": theme.accentStrong,
    "--pm-color-danger": theme.danger,
    "--pm-color-success": theme.success,
    "--pm-color-info": theme.info
  };
}

export function summarizeTokens(): Record<string, unknown> {
  return {
    colors: Object.keys(colorScale),
    breakpoints,
    spacing: spacingScale,
    radii,
    typography: {
      families: typographyScale.family,
      sizes: typographyScale.size
    }
  };
}
