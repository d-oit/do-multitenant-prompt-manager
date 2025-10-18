import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import TenantSelector from "./components/TenantSelector";

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PromptsPage = lazy(() => import("./pages/PromptsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const TenantsPage = lazy(() => import("./pages/TenantsPage"));
import Button from "./components/ui/Button";
import Badge from "./components/ui/Badge";
import { ThemeSwitcher } from "./components/ui/ThemeSwitcher";
import { ToastContainer, useToast } from "./components/ui/Toast";
import {
  KeyboardShortcutsHelp,
  type KeyboardShortcut,
  useKeyboardShortcuts
} from "./components/ui/KeyboardShortcuts";
import { LoadingOverlay, Spinner } from "./components/ui/LoadingState";
import { ErrorState, NoTenants } from "./components/ui/EmptyState";
import { cn } from "./design-system/utils";
import { createTenant, listTenants } from "./lib/api";
import type { Tenant, TenantCreateInput } from "./types";
import NotificationMenu from "./components/NotificationMenu";
import MobileNavigation from "./components/MobileNavigation";

type ViewId = "dashboard" | "prompts" | "analytics" | "tenants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const navItems: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "prompts", label: "Prompts", icon: "✨" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "tenants", label: "Tenants", icon: "🏢" }
];

// Cookie-based sessions are used; no client-side token resolver needed.

export default function App(): JSX.Element {
  const toast = useToast();
  const { error: showTenantError } = toast;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  // Authentication is now cookie-based (HttpOnly Secure cookie). Do not store tokens in localStorage.
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [promptComposerSignal, setPromptComposerSignal] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installAvailable, setInstallAvailable] = useState(false);

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  // No local token persistence required for cookie-based sessions.

  useEffect(() => {
    let cancelled = false;
    async function loadTenants() {
      setTenantsLoading(true);
      setTenantsError(null);
      try {
        const response = await listTenants();
        if (cancelled) return;
        setTenants(response);
        if (!response.length) {
          setSelectedTenantId("");
        } else if (
          !selectedTenantId ||
          !response.some((tenant) => tenant.id === selectedTenantId)
        ) {
          setSelectedTenantId(response[0].id);
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setTenantsError(message || "Failed to load tenants");
        showTenantError(`Unable to load tenants: ${message}`);
      } finally {
        if (!cancelled) {
          setTenantsLoading(false);
        }
      }
    }

    void loadTenants();
    return () => {
      cancelled = true;
    };
  }, [selectedTenantId, showTenantError]);

  useEffect(() => {
    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallAvailable(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    function handleOffline() {
      toast.warning("You’re offline. Changes will sync when back online.");
    }
    function handleOnline() {
      toast.success("Connection restored");
    }
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [toast]);

  const handleTenantSelect = useCallback((tenantId: string) => {
    setSelectedTenantId(tenantId);
  }, []);

  const handleCreateTenant = useCallback(
    async (input: TenantCreateInput) => {
      setCreatingTenant(true);
      try {
        const tenant = await createTenant(input);
        setTenants((prev) => [...prev, tenant]);
        setSelectedTenantId(tenant.id);
        toast.success(`Tenant “${tenant.name}” created`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to create tenant: ${message}`);
        throw error;
      } finally {
        setCreatingTenant(false);
      }
    },
    [toast]
  );

  const shortcuts = useMemo<KeyboardShortcut[]>(() => {
    return [
      {
        keys: ["?"],
        description: "Show keyboard shortcuts",
        action: () => setShowShortcuts(true),
        category: "General"
      },
      {
        keys: [modKey, "N"],
        description: "Create prompt",
        action: () => setPromptComposerSignal((count) => count + 1),
        category: "Prompts"
      },
      {
        keys: ["G", "D"],
        description: "Go to Dashboard",
        action: () => setActiveView("dashboard"),
        category: "Navigation"
      },
      {
        keys: ["G", "P"],
        description: "Go to Prompts",
        action: () => setActiveView("prompts"),
        category: "Navigation"
      },
      {
        keys: ["G", "A"],
        description: "Go to Analytics",
        action: () => setActiveView("analytics"),
        category: "Navigation"
      },
      {
        keys: ["G", "T"],
        description: "Go to Tenants",
        action: () => setActiveView("tenants"),
        category: "Navigation"
      }
    ];
  }, [modKey, setShowShortcuts, setActiveView, setPromptComposerSignal]);

  const { showHelp, setShowHelp } = useKeyboardShortcuts({ shortcuts });

  useEffect(() => {
    if (showHelp) {
      setShowShortcuts(true);
    }
  }, [showHelp]);

  // token input removed; authentication is handled with HttpOnly cookies.

  const renderMainContent = () => {
    if (tenantsLoading) {
      return (
        <div className="pm-center">
          <Spinner />
        </div>
      );
    }

    if (tenantsError) {
      return <ErrorState error={tenantsError} onRetry={() => setTenantsError(null)} />;
    }

    if (!tenants.length) {
      return <NoTenants onCreateTenant={() => setShowShortcuts(false)} />;
    }

    if (!selectedTenantId) {
      return <LoadingOverlay message="Select a tenant to continue" />;
    }

    return (
      <Suspense fallback={<LoadingOverlay message="Loading page..." />}>
        {activeView === "dashboard" && <DashboardPage tenantId={selectedTenantId} />}
        {activeView === "prompts" && (
          <PromptsPage
            tenantId={selectedTenantId}
            toast={toast}
            createSignal={promptComposerSignal}
          />
        )}
        {activeView === "analytics" && <AnalyticsPage tenantId={selectedTenantId} />}
        {activeView === "tenants" && <TenantsPage tenants={tenants} />}
      </Suspense>
    );
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallAvailable(false);
    toast.success("App install prompt shown");
  };

  return (
    <div className="app-shell">
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
      <header className="app-shell__header glass">
        <div className="app-header flex items-center justify-between gap-lg">
          <div className="flex items-center gap-md">
            <MobileNavigation
              navItems={navItems}
              activeView={activeView}
              onViewChange={setActiveView}
              className="mobile-nav--header"
            />
            <h1 className="app-header__title text-gradient">d.o. Prompt Manager</h1>
            <Badge tone="info">Production</Badge>
          </div>
          <div className="flex items-center gap-md">
            <NotificationMenu />
            {installAvailable ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleInstallClick()}
                className="scale-on-hover"
              >
                Install app
              </Button>
            ) : null}
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <aside className="app-shell__sidebar">
        <div className="stack-lg stagger-fade-in">
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={handleTenantSelect}
            onCreateTenant={handleCreateTenant}
            busy={creatingTenant}
          />
          <nav className="stack-sm" role="navigation" aria-label="Sidebar navigation">
            {navItems.map((item, index) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "primary" : "ghost"}
                className={cn(
                  "app-nav__item ripple scale-on-hover",
                  activeView === item.id && "app-nav__item--active"
                )}
                onClick={() => setActiveView(item.id)}
                style={{ animationDelay: `${(index + 1) * 0.05}s` }}
                aria-label={item.label}
                aria-current={activeView === item.id ? "page" : undefined}
              >
                <span className="app-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="app-sidebar__shortcuts">
            <h3 className="app-sidebar__section-title">Shortcuts</h3>
            <ul className="app-sidebar__shortcut-list">
              <li>
                <kbd>{modKey}+N</kbd>
                <span>New Prompt</span>
              </li>
              <li>
                <kbd>G</kbd> then <kbd>P</kbd>
                <span>Prompts</span>
              </li>
              <li>
                <kbd>?</kbd>
                <span>Help</span>
              </li>
            </ul>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              aria-label="View all keyboard shortcuts"
            >
              View all shortcuts
            </Button>
          </div>
        </div>
      </aside>
      <main className="app-shell__main custom-scrollbar">{renderMainContent()}</main>
      <nav className="app-bottom-nav" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => (
          <Button
            key={`mobile-${item.id}`}
            variant={activeView === item.id ? "primary" : "ghost"}
            className={cn(
              "app-bottom-nav__item",
              activeView === item.id && "app-bottom-nav__item--active"
            )}
            onClick={() => setActiveView(item.id)}
            aria-label={item.label}
            aria-current={activeView === item.id ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Button>
        ))}
      </nav>
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => {
          setShowShortcuts(false);
          setShowHelp(false);
        }}
        shortcuts={shortcuts}
      />
    </div>
  );
}
