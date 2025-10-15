/**
 * Dark Mode Toggle Component
 * Manages theme switching with system preference detection
 */

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Get system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // Listen for system preference changes
    const handleChange = () => {
      if (theme === "system") {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    if (resolvedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [resolvedTheme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="dark-mode-toggle">
      <button
        onClick={() => handleThemeChange(resolvedTheme === "dark" ? "light" : "dark")}
        className="dark-mode-toggle__button"
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        title={`Currently ${resolvedTheme} mode`}
        type="button"
      >
        {resolvedTheme === "dark" ? (
          <svg
            className="dark-mode-toggle__icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            className="dark-mode-toggle__icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Optional dropdown for system/light/dark selection */}
      <div className="dark-mode-toggle__dropdown">
        <button
          className={`dark-mode-toggle__option ${
            theme === "light" ? "dark-mode-toggle__option--active" : ""
          }`}
          onClick={() => handleThemeChange("light")}
          type="button"
        >
          ☀️ Light
        </button>
        <button
          className={`dark-mode-toggle__option ${
            theme === "dark" ? "dark-mode-toggle__option--active" : ""
          }`}
          onClick={() => handleThemeChange("dark")}
          type="button"
        >
          🌙 Dark
        </button>
        <button
          className={`dark-mode-toggle__option ${
            theme === "system" ? "dark-mode-toggle__option--active" : ""
          }`}
          onClick={() => handleThemeChange("system")}
          type="button"
        >
          💻 System
        </button>
      </div>
    </div>
  );
}

// Hook for using theme in components
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    const handleChange = () => {
      if (theme === "system") {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue
  };
}
