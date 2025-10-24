/**
 * CDN Configuration and Middleware
 *
 * Configuration for CDN integration to offload static assets.
 * Supports multiple CDN providers (Cloudflare, CloudFront, Fastly).
 */

import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";

/**
 * CDN provider types
 */
export type CDNProvider = "cloudflare" | "cloudfront" | "fastly";

/**
 * CDN configuration interface
 */
export interface CDNConfig {
  provider: CDNProvider;
  baseUrl: string;
  staticAssets: string[];
  cacheControl: Record<string, string>;
}

/**
 * CDN configuration
 */
export const cdnConfig: CDNConfig = {
  provider: (process.env.CDN_PROVIDER as CDNProvider) || "cloudflare",
  baseUrl: process.env.CDN_URL || "https://cdn.shufflesync.com",

  // Asset types to serve from CDN
  staticAssets: ["/images/*", "/css/*", "/js/*", "/fonts/*", "/assets/*"],

  // Cache headers for different asset types
  cacheControl: {
    images: "public, max-age=31536000, immutable", // 1 year
    css: "public, max-age=31536000, immutable",
    js: "public, max-age=31536000, immutable",
    fonts: "public, max-age=31536000, immutable",
    html: "public, max-age=3600", // 1 hour
  },
};

/**
 * Check if a URL matches CDN asset patterns
 */
function shouldUseCDN(url: string): boolean {
  return cdnConfig.staticAssets.some((pattern) => {
    const regex = new RegExp(pattern.replace("*", ".*"));
    return regex.test(url);
  });
}

/**
 * Rewrite URLs in data to use CDN
 */
function rewriteUrls(data: unknown, cdnBaseUrl: string): unknown {
  if (!data) return data;

  if (typeof data === "string") {
    // Check if string is a URL that should use CDN
    if (shouldUseCDN(data)) {
      const rewrittenUrl = `${cdnBaseUrl}${data}`;
      logger.debug("Rewrote URL to CDN", {
        original: data,
        rewritten: rewrittenUrl,
      });
      return rewrittenUrl;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => rewriteUrls(item, cdnBaseUrl));
  }

  if (typeof data === "object") {
    const rewritten: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      rewritten[key] = rewriteUrls(value, cdnBaseUrl);
    }
    return rewritten;
  }

  return data;
}

/**
 * Middleware to rewrite static asset URLs in responses to use CDN
 *
 * This intercepts JSON responses and rewrites any URLs that match
 * the configured static asset patterns to use the CDN base URL.
 *
 * @example
 * ```typescript
 * app.use(cdnRewriteMiddleware);
 * ```
 */
export const cdnRewriteMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Only rewrite if CDN is configured
  if (!cdnConfig.baseUrl || cdnConfig.baseUrl === "") {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to rewrite URLs
  res.json = function (data: unknown): Response {
    try {
      const rewritten = rewriteUrls(data, cdnConfig.baseUrl);
      return originalJson(rewritten);
    } catch (error) {
      logger.error("Failed to rewrite CDN URLs", error, { path: req.path });
      // Fall back to original response if rewriting fails
      return originalJson(data);
    }
  };

  next();
};

/**
 * Middleware to set appropriate cache headers for static assets
 *
 * @example
 * ```typescript
 * app.use(cdnCacheHeadersMiddleware);
 * ```
 */
export const cdnCacheHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const url = req.url;

  // Set cache headers based on asset type
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    res.setHeader("Cache-Control", cdnConfig.cacheControl.images);
  } else if (url.match(/\.css$/i)) {
    res.setHeader("Cache-Control", cdnConfig.cacheControl.css);
  } else if (url.match(/\.js$/i)) {
    res.setHeader("Cache-Control", cdnConfig.cacheControl.js);
  } else if (url.match(/\.(woff|woff2|ttf|eot)$/i)) {
    res.setHeader("Cache-Control", cdnConfig.cacheControl.fonts);
  } else if (url.match(/\.html$/i)) {
    res.setHeader("Cache-Control", cdnConfig.cacheControl.html);
  }

  next();
};

/**
 * Export utilities for testing
 */
export const cdnUtils = {
  shouldUseCDN,
  rewriteUrls,
};

/**
 * Default export
 */
export default {
  cdnConfig,
  cdnRewriteMiddleware,
  cdnCacheHeadersMiddleware,
  cdnUtils,
};
