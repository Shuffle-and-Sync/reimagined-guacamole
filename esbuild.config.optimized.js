/* eslint-env node */
import esbuild from "esbuild";
import path from "path";

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === "production";

// Plugin to externalize node_modules packages (simplified)
const externalizeNodeModulesPlugin = {
  name: "externalize-node-modules",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      // Skip project aliases - let them be resolved by esbuild's alias feature
      if (args.path.startsWith("@shared")) {
        return; // Let esbuild handle these
      }

      // Externalize Node.js built-ins
      if (args.path.startsWith("node:")) {
        return { path: args.path, external: true };
      }

      // Externalize the entire vite.ts file and anything vite-related
      if (
        args.path === "./vite" ||
        args.path === "./vite.js" ||
        args.path.endsWith("/vite.ts") ||
        args.path.endsWith("/vite.js") ||
        args.path === "./server/vite" ||
        args.path === "server/vite" ||
        (args.path === "./static-server" && args.importer.includes("vite"))
      ) {
        return { path: args.path, external: true };
      }

      // Externalize vite and vite-related paths specifically
      if (
        args.path.includes("vite.config") ||
        args.path === "vite" ||
        args.path.startsWith("@vitejs/") ||
        args.path.startsWith("@replit/vite-") ||
        args.path === "../vite.config.js" ||
        args.path.endsWith("vite.config.js") ||
        args.path.endsWith("vite.config.ts")
      ) {
        return { path: args.path, external: true };
      }

      // Externalize real node_modules packages (normal and scoped)
      if (
        args.path.match(/^[^@./]/) || // matches normal package names like 'express'
        args.path.match(/^@[^/]+\/[^/]+/)
      ) {
        // matches scoped packages
        return { path: args.path, external: true };
      }
    });
  },
};

const config = {
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "dist",
  packages: "external",
  plugins: [externalizeNodeModulesPlugin],
  // Use esbuild's built-in alias feature for project aliases
  alias: {
    "@shared": path.resolve(process.cwd(), "shared"),
  },
  // Handle .node files and other binary modules
  loader: {
    ".node": "copy",
  },
  // Ensure proper module resolution for ES modules
  banner: {
    js: `
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__filename = __filename;
global.__dirname = __dirname;
    `.trim(),
  },
  // Handle Node.js globals properly
  define: {
    global: "globalThis",
  },
  // Enable minification in production for smaller bundle size
  minify: isProduction,
  // More aggressive tree shaking
  treeShaking: true,
  // Drop console logs and debugger statements in production
  drop: isProduction ? ["console", "debugger"] : [],
  // Keep names for better debugging in development
  keepNames: !isProduction,
  // Add legal comments (licenses) inline
  legalComments: "inline",
  // Target Node.js 18
  target: "node18",
  // Generate metafile for bundle analysis
  metafile: true,
  // Handle Node.js globals properly
  external: [
    "node:*",
    // Vite and related dependencies - completely external
    "vite",
    "vite/*",
    "@vitejs/*",
    "@replit/vite-*",
    "../vite.config.js",
    "./vite.js",
    "./vite",
  ],
};

export default config;

// Run the build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  esbuild
    .build(config)
    .then(async (result) => {
      // Write metafile for analysis if requested
      if (process.env.ANALYZE === "true" && result.metafile) {
        const fs = await import("fs");
        fs.writeFileSync(
          "dist/esbuild-meta.json",
          JSON.stringify(result.metafile),
        );
        console.log(
          "✅ Build complete. Metafile written to dist/esbuild-meta.json",
        );
        console.log(
          "📊 Analyze with: npx esbuild-visualizer --metadata dist/esbuild-meta.json",
        );
      }
      console.log("✅ Backend build complete");
    })
    .catch(() => process.exit(1));
}
