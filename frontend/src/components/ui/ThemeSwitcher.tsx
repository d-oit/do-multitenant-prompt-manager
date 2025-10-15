/**
 * Modern Theme Switcher Component (2025 Best Practices)
 * Mobile-first dropdown with bottom sheet on mobile, popover on desktop
 * Follows WCAG 2.1 AA accessibility standards with proper touch targets
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "../../design-system/utils";

type Theme = "light" | "dark" | "system";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: JSX.Element;
  description: string;
}

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: <span aria-hidden="true">☀️</span>,
    description: "Light theme"
  },
  {
    value: "dark",
    label: "Dark",
    icon: <span aria-hidden="true">🌙</span>,
    description: "Dark theme"
  },
  {
    value: "system",
    label: "System",
    icon: <span aria-hidden="true">💻</span>,
    description: "Use system preference"
  }
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const currentThemeOption = themeOptions.find((opt) => opt.value === theme) || themeOptions[2];

  return (
    <>
      <div className="theme-switcher">
        <button
          ref={buttonRef}
          className="theme-switcher__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Theme selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="theme-menu"
          type="button"
        >
          <span className="theme-switcher__trigger-icon">{currentThemeOption.icon}</span>
          <span className="theme-switcher__trigger-label">{currentThemeOption.label}</span>
          <svg
            className={cn(
              "theme-switcher__trigger-chevron",
              isOpen && "theme-switcher__trigger-chevron--open"
            )}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            id="theme-menu"
            className="theme-switcher__dropdown"
            role="listbox"
            aria-label="Theme options"
          >
            <div className="theme-switcher__dropdown-header">
              <span className="theme-switcher__dropdown-title">Choose theme</span>
            </div>
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "theme-switcher__option",
                  theme === option.value && "theme-switcher__option--active"
                )}
                onClick={() => handleThemeChange(option.value)}
                role="option"
                aria-selected={theme === option.value}
                type="button"
              >
                <span className="theme-switcher__option-icon">{option.icon}</span>
                <span className="theme-switcher__option-content">
                  <span className="theme-switcher__option-label">{option.label}</span>
                  <span className="theme-switcher__option-description">{option.description}</span>
                </span>
                {theme === option.value && (
                  <span className="theme-switcher__option-check" aria-label="Selected">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="theme-switcher__backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
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
