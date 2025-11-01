import path from "path";
import express, { Response } from "express";
import { getCacheControlHeader } from "../config/cdn.config";

/**
 * Static Assets Middleware
 *
 * Serves static files with appropriate cache headers for CDN optimization
 */
export function staticAssetsMiddleware() {
  const router = express.Router();

  // Serve static files with appropriate cache headers
  router.use(
    "/static",
    express.static(path.join(__dirname, "../../dist/public"), {
      maxAge: 0, // Let CDN handle caching
      etag: true,
      lastModified: true,
      setHeaders: (res: Response, filePath: string) => {
        // Determine asset type and set appropriate cache headers
        if (/\.(js|mjs)$/.test(filePath)) {
          res.setHeader("Cache-Control", getCacheControlHeader("scripts"));
          res.setHeader(
            "Content-Type",
            "application/javascript; charset=utf-8",
          );
        } else if (/\.css$/.test(filePath)) {
          res.setHeader("Cache-Control", getCacheControlHeader("styles"));
          res.setHeader("Content-Type", "text/css; charset=utf-8");
        } else if (/\.(woff2?|ttf|eot)$/.test(filePath)) {
          res.setHeader("Cache-Control", getCacheControlHeader("fonts"));
          res.setHeader("Access-Control-Allow-Origin", "*");
        } else if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(filePath)) {
          res.setHeader("Cache-Control", getCacheControlHeader("images"));
        }

        // Security headers
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  return router;
}
