import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(<App />);

// Register service worker for offline support (production only)
if (process.env.NODE_ENV === "production") {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log("Content cached for offline use."), // eslint-disable-line no-console
    onUpdate: (registration) => {
      console.log("New version available! Please refresh."); // eslint-disable-line no-console
      // Optionally show update notification to user
      if (window.confirm("New version available! Reload to update?")) {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    },
  });
}
