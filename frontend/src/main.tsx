import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary.tsx";
import { registerServiceWorker } from "./lib/serviceWorker";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: () => {
      console.log("[App] Service worker registered successfully");
    },
    onUpdate: () => {
      console.log("[App] New version available, please refresh");
      // Could show a toast notification here
    },
    onError: (error) => {
      console.error("[App] Service worker registration failed:", error);
    }
  });
}
