import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary.tsx";
import { registerServiceWorker, unregisterServiceWorker } from "./lib/serviceWorker";
import "./styles.css";

function mountApp() {
  const rootElement = document.getElementById("app");
  if (!rootElement) {
    console.error("Root element #app not found. DOM state:", document.readyState);
    console.error("Body children:", document.body?.children);
    throw new Error("Root element #app not found");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );

  console.log("[App] React app mounted successfully");
}

// Wait for DOM to be fully ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp);
} else {
  // DOM is already loaded, but wait for next tick to ensure everything is ready
  setTimeout(mountApp, 0);
}

// Service worker management
if (import.meta.env.DEV) {
  // Unregister service worker in development to avoid caching issues
  unregisterServiceWorker().then((success) => {
    if (success) {
      console.log("[App] Service worker unregistered for development");
    }
  });
} else {
  // Register service worker for offline support in production
  registerServiceWorker({
    onSuccess: () => {
      console.log("[App] Service worker registered successfully");
    },
    onUpdate: () => {
      console.log("[App] New version available, please refresh");
    },
    onError: (error) => {
      console.error("[App] Service worker registration failed:", error);
    }
  });
}
