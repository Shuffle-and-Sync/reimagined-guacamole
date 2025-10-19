import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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
