import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";

// Safe path resolution that works in both development and bundled environments
const getProjectRoot = () => {
  if (typeof import.meta !== "undefined" && import.meta.dirname) {
    return import.meta.dirname;
  }
  return process.cwd();
};

const projectRoot = getProjectRoot();

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
    // Bundle analyzer - generates stats.html after build
    process.env.ANALYZE === "true"
      ? visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          filename: "dist/stats.html",
        })
      : undefined,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
      "@shared": path.resolve(projectRoot, "shared"),
    },
  },
  root: path.resolve(projectRoot, "client"),
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
    // Enable source maps for production debugging (optional, can be disabled for smaller builds)
    sourcemap: false,
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // More strict chunk size warning limit
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Optimized manual chunks for better code splitting and caching
        manualChunks: {
          // Split React vendor into core and forms
          "react-core": ["react", "react-dom"],
          "react-forms": ["react-hook-form", "@hookform/resolvers"],

          // Split UI components by usage frequency
          // Core UI components (used on almost every page)
          "ui-core": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // Extended UI components (used less frequently)
          "ui-extended": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
          ],
          // Advanced UI components (rarely used)
          "ui-advanced": [
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
          ],

          // Routing and state management (keep together)
          "state-vendor": ["wouter", "@tanstack/react-query", "zustand"],

          // Split utilities by category
          "date-vendor": ["date-fns"],
          "utils-vendor": ["clsx", "tailwind-merge", "zod"],

          // Icons and animations separate for better code splitting
          icons: ["lucide-react"],
          animations: ["framer-motion"],
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || "")) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext || "")) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    // Minification options - use esbuild for fastest builds
    minify: "esbuild",
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Optimize CSS
    cssMinify: true,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "wouter",
      "date-fns",
      "clsx",
      "tailwind-merge",
    ],
    // Exclude dev dependencies that should not be pre-bundled
    exclude: ["@storybook/test"],
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
