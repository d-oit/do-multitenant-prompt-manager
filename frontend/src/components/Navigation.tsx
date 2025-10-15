/**
 * Modern Responsive Navigation Component (2025 Best Practices)
 * Mobile-first design with responsive breakpoints for tablet, desktop, and larger screens
 * Features: Bottom navigation on mobile, sidebar on desktop, hamburger menu, accessibility
 */

import { useEffect, useState } from "react";
import { cn } from "../design-system/utils";

type ViewId = "dashboard" | "prompts" | "analytics" | "tenants";

interface NavItem {
  id: ViewId;
  label: string;
  icon: JSX.Element;
  badge?: number;
}

interface NavigationProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  userName?: string;
  userAvatar?: string;
}

// Modern icon components
const DashboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const PromptsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const TenantsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function Navigation({ activeView, onNavigate, userName, userAvatar }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "prompts", label: "Prompts", icon: <PromptsIcon /> },
    { id: "analytics", label: "Analytics", icon: <AnalyticsIcon /> },
    { id: "tenants", label: "Tenants", icon: <TenantsIcon /> }
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleNavigation = (view: ViewId) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="nav-sidebar">
        <div className="nav-sidebar__header">
          <div className="nav-sidebar__logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="nav-sidebar__logo-icon"
            >
              <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1" />
              <path
                d="M16 8l8 4v8l-8 4-8-4v-8l8-4z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <span className="nav-sidebar__logo-text">Prompt Manager</span>
          </div>
        </div>

        <nav className="nav-sidebar__nav" role="navigation" aria-label="Main navigation">
          <ul className="nav-sidebar__list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={cn(
                    "nav-sidebar__item",
                    activeView === item.id && "nav-sidebar__item--active"
                  )}
                  onClick={() => handleNavigation(item.id)}
                  aria-current={activeView === item.id ? "page" : undefined}
                  type="button"
                >
                  <span className="nav-sidebar__item-icon">{item.icon}</span>
                  <span className="nav-sidebar__item-label">{item.label}</span>
                  {item.badge && (
                    <span
                      className="nav-sidebar__item-badge"
                      aria-label={`${item.badge} notifications`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {userName && (
          <div className="nav-sidebar__footer">
            <button className="nav-sidebar__user" type="button" aria-label="User menu">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="nav-sidebar__user-avatar" />
              ) : (
                <div className="nav-sidebar__user-avatar nav-sidebar__user-avatar--placeholder">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="nav-sidebar__user-name">{userName}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Top Bar */}
      <header className="nav-mobile-header">
        <button
          className="nav-mobile-header__menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          type="button"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="nav-mobile-header__logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1" />
            <path
              d="M16 8l8 4v8l-8 4-8-4v-8l8-4z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <span className="nav-mobile-header__logo-text">Prompt Manager</span>
        </div>

        {userName && (
          <button className="nav-mobile-header__user" type="button" aria-label="User menu">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="nav-mobile-header__user-avatar" />
            ) : (
              <div className="nav-mobile-header__user-avatar nav-mobile-header__user-avatar--placeholder">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        )}
      </header>

      {/* Mobile Overlay Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="nav-mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="nav-mobile-menu" role="dialog" aria-label="Navigation menu">
            <nav role="navigation" aria-label="Main navigation">
              <ul className="nav-mobile-menu__list">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      className={cn(
                        "nav-mobile-menu__item",
                        activeView === item.id && "nav-mobile-menu__item--active"
                      )}
                      onClick={() => handleNavigation(item.id)}
                      aria-current={activeView === item.id ? "page" : undefined}
                      type="button"
                    >
                      <span className="nav-mobile-menu__item-icon">{item.icon}</span>
                      <span className="nav-mobile-menu__item-label">{item.label}</span>
                      {item.badge && (
                        <span className="nav-mobile-menu__item-badge">{item.badge}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="nav-bottom" role="navigation" aria-label="Main navigation">
        <ul className="nav-bottom__list">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={cn(
                  "nav-bottom__item",
                  activeView === item.id && "nav-bottom__item--active"
                )}
                onClick={() => handleNavigation(item.id)}
                aria-current={activeView === item.id ? "page" : undefined}
                aria-label={item.label}
                type="button"
              >
                <span className="nav-bottom__item-icon">{item.icon}</span>
                <span className="nav-bottom__item-label">{item.label}</span>
                {item.badge && (
                  <span
                    className="nav-bottom__item-badge"
                    aria-label={`${item.badge} notifications`}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
