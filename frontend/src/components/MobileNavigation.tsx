/**
 * Mobile Navigation Component
 * Provides hamburger menu and swipe gestures for mobile devices
 */

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../design-system/utils";
import Button from "./ui/Button";

type ViewId = "dashboard" | "prompts" | "analytics" | "tenants";

interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
}

interface MobileNavigationProps {
  navItems: NavItem[];
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  className?: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={cn("mobile-nav__hamburger-icon", isOpen && "mobile-nav__hamburger-icon--open")}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line
      x1="3"
      y1="6"
      x2="21"
      y2="6"
      className="mobile-nav__hamburger-line mobile-nav__hamburger-line--top"
    />
    <line
      x1="3"
      y1="12"
      x2="21"
      y2="12"
      className="mobile-nav__hamburger-line mobile-nav__hamburger-line--middle"
    />
    <line
      x1="3"
      y1="18"
      x2="21"
      y2="18"
      className="mobile-nav__hamburger-line mobile-nav__hamburger-line--bottom"
    />
  </svg>
);

const MobileMenu = forwardRef<HTMLDivElement, MobileMenuProps>(
  ({ isOpen, onClose, navItems, activeView, onViewChange }, ref) => {
    const handleItemClick = useCallback(
      (viewId: ViewId) => {
        onViewChange(viewId);
        onClose();
      },
      [onViewChange, onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <>
        <button
          type="button"
          className="mobile-nav__overlay"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
          aria-label="Close navigation overlay"
        />
        <div
          ref={ref}
          className="mobile-nav__menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="mobile-nav__menu-header">
            <h2 className="mobile-nav__menu-title">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="mobile-nav__close-button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
          <nav className="mobile-nav__menu-nav">
            <ul className="mobile-nav__menu-list">
              {navItems.map((item, index) => (
                <li key={item.id} className="mobile-nav__menu-item">
                  <Button
                    variant={activeView === item.id ? "primary" : "ghost"}
                    className={cn(
                      "mobile-nav__menu-button",
                      activeView === item.id && "mobile-nav__menu-button--active"
                    )}
                    onClick={() => handleItemClick(item.id)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <span className="mobile-nav__menu-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="mobile-nav__menu-label">{item.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </>
    );
  }
);

MobileMenu.displayName = "MobileMenu";

export const MobileNavigation = forwardRef<HTMLDivElement, MobileNavigationProps>(
  ({ navItems, activeView, onViewChange, className }, ref) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = useCallback(() => {
      setIsMenuOpen((prev) => !prev);
    }, []);

    const closeMenu = useCallback(() => {
      setIsMenuOpen(false);
    }, []);

    // Close menu on escape key
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isMenuOpen) {
          closeMenu();
        }
      };

      if (isMenuOpen) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [isMenuOpen, closeMenu]);

    // Handle focus management
    useEffect(() => {
      if (isMenuOpen && menuRef.current) {
        const firstFocusable = menuRef.current.querySelector("button");
        firstFocusable?.focus();
      }
    }, [isMenuOpen]);

    return (
      <div ref={ref} className={cn("mobile-nav", className)}>
        <Button
          variant="ghost"
          size="md"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-menu"
          className="mobile-nav__hamburger-button"
        >
          <HamburgerIcon isOpen={isMenuOpen} />
        </Button>

        <MobileMenu
          ref={menuRef}
          isOpen={isMenuOpen}
          onClose={closeMenu}
          navItems={navItems}
          activeView={activeView}
          onViewChange={onViewChange}
        />
      </div>
    );
  }
);

MobileNavigation.displayName = "MobileNavigation";

export default MobileNavigation;
