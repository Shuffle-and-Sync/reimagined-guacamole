import fs from "fs";
import { type Server } from "http";
import path from "path";
import express, { type Express } from "express";
import { nanoid } from "nanoid";
import { logger } from "./logger";

export function log(message: string, source = "express") {
  // Use structured logger instead of custom console formatting
  logger.info(message, { source });
}

export async function setupVite(app: Express, server: Server) {
  // This function should never be called in production, but add a guard just in case
  if (process.env.NODE_ENV === "production") {
    throw new Error("setupVite should not be called in production mode");
  }

  // Dynamically import all vite dependencies to avoid bundling them
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteLogger = createLogger();

  // Skip vite config import entirely and use a minimal config
  // This prevents vite.config.ts from being bundled
  const viteConfig = {
    plugins: [],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "client", "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
      },
    },
    root: path.resolve(process.cwd(), "client"),
    build: {
      outDir: path.resolve(process.cwd(), "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Use __dirname fallback for bundled environments
      const dirname =
        typeof import.meta !== "undefined" && import.meta.dirname
          ? import.meta.dirname
          : process.cwd();

      const clientTemplate = path.resolve(
        dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use safe path resolution for production
  const dirname =
    typeof import.meta !== "undefined" && import.meta.dirname
      ? import.meta.dirname
      : process.cwd();

  const distPath = path.resolve(dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
