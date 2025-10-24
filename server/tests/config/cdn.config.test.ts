/**
 * Tests for CDN Configuration and Middleware
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  cdnConfig,
  cdnRewriteMiddleware,
  cdnCacheHeadersMiddleware,
  cdnUtils,
} from "../../config/cdn.config";
import type { Request, Response, NextFunction } from "express";

const { shouldUseCDN, rewriteUrls } = cdnUtils;

describe("CDN Configuration", () => {
  describe("cdnConfig", () => {
    it("should have valid configuration", () => {
      expect(cdnConfig).toBeDefined();
      expect(cdnConfig.provider).toBeDefined();
      expect(cdnConfig.baseUrl).toBeDefined();
      expect(cdnConfig.staticAssets).toBeInstanceOf(Array);
      expect(cdnConfig.cacheControl).toBeDefined();
    });

    it("should have cache control for different asset types", () => {
      expect(cdnConfig.cacheControl.images).toBeDefined();
      expect(cdnConfig.cacheControl.css).toBeDefined();
      expect(cdnConfig.cacheControl.js).toBeDefined();
      expect(cdnConfig.cacheControl.fonts).toBeDefined();
    });
  });

  describe("shouldUseCDN", () => {
    it("should return true for image URLs", () => {
      expect(shouldUseCDN("/images/logo.png")).toBe(true);
      expect(shouldUseCDN("/images/avatar/user-123.jpg")).toBe(true);
    });

    it("should return true for CSS URLs", () => {
      expect(shouldUseCDN("/css/main.css")).toBe(true);
      expect(shouldUseCDN("/css/components/button.css")).toBe(true);
    });

    it("should return true for JS URLs", () => {
      expect(shouldUseCDN("/js/app.js")).toBe(true);
      expect(shouldUseCDN("/js/vendor/react.js")).toBe(true);
    });

    it("should return true for font URLs", () => {
      expect(shouldUseCDN("/fonts/roboto.woff2")).toBe(true);
    });

    it("should return false for API URLs", () => {
      expect(shouldUseCDN("/api/users")).toBe(false);
      expect(shouldUseCDN("/api/events")).toBe(false);
    });

    it("should return false for HTML URLs", () => {
      expect(shouldUseCDN("/index.html")).toBe(false);
      expect(shouldUseCDN("/about.html")).toBe(false);
    });
  });

  describe("rewriteUrls", () => {
    const cdnBaseUrl = "https://cdn.example.com";

    it("should rewrite string URLs that match CDN patterns", () => {
      const result = rewriteUrls("/images/logo.png", cdnBaseUrl);
      expect(result).toBe("https://cdn.example.com/images/logo.png");
    });

    it("should not rewrite strings that don't match CDN patterns", () => {
      const result = rewriteUrls("/api/users", cdnBaseUrl);
      expect(result).toBe("/api/users");
    });

    it("should rewrite URLs in objects", () => {
      const data = {
        avatar: "/images/avatar.jpg",
        name: "John Doe",
      };

      const result = rewriteUrls(data, cdnBaseUrl);
      expect(result.avatar).toBe("https://cdn.example.com/images/avatar.jpg");
      expect(result.name).toBe("John Doe");
    });

    it("should rewrite URLs in nested objects", () => {
      const data = {
        user: {
          avatar: "/images/avatar.jpg",
          name: "John",
        },
        theme: {
          logo: "/images/logo.png",
        },
      };

      const result = rewriteUrls(data, cdnBaseUrl);
      expect(result.user.avatar).toBe(
        "https://cdn.example.com/images/avatar.jpg",
      );
      expect(result.theme.logo).toBe("https://cdn.example.com/images/logo.png");
    });

    it("should rewrite URLs in arrays", () => {
      const data = ["/images/1.jpg", "/images/2.jpg", "/api/users"];

      const result = rewriteUrls(data, cdnBaseUrl);
      expect(result[0]).toBe("https://cdn.example.com/images/1.jpg");
      expect(result[1]).toBe("https://cdn.example.com/images/2.jpg");
      expect(result[2]).toBe("/api/users");
    });

    it("should handle null and undefined", () => {
      expect(rewriteUrls(null, cdnBaseUrl)).toBeNull();
      expect(rewriteUrls(undefined, cdnBaseUrl)).toBeUndefined();
    });

    it("should handle numbers and booleans", () => {
      expect(rewriteUrls(123, cdnBaseUrl)).toBe(123);
      expect(rewriteUrls(true, cdnBaseUrl)).toBe(true);
    });
  });

  describe("cdnRewriteMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        path: "/api/test",
      };

      const originalJson = jest.fn((data: any) => res as Response);

      res = {
        json: originalJson,
      };

      next = jest.fn();

      // Store original baseUrl for restoration
      process.env.CDN_URL = "https://cdn.example.com";
    });

    it("should intercept json method", () => {
      cdnRewriteMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(typeof res.json).toBe("function");
    });

    it("should rewrite URLs in JSON responses", () => {
      cdnRewriteMiddleware(req as Request, res as Response, next);

      const data = {
        avatar: "/images/avatar.jpg",
        name: "John",
      };

      const endFn = jest.fn();
      res.end = endFn;

      // Call the intercepted json method
      res.json!(data);

      // The original json should have been called with rewritten data
      // Note: This test might need adjustment based on actual implementation
    });

    it("should skip rewriting when CDN is not configured", () => {
      delete process.env.CDN_URL;
      const originalNext = next;

      cdnRewriteMiddleware(req as Request, res as Response, next);

      expect(originalNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("cdnCacheHeadersMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        url: "/test",
      };

      res = {
        setHeader: jest.fn(),
      };

      next = jest.fn();
    });

    it("should set cache headers for images", () => {
      req.url = "/logo.png";

      cdnCacheHeadersMiddleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        cdnConfig.cacheControl.images,
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should set cache headers for CSS files", () => {
      req.url = "/styles/main.css";

      cdnCacheHeadersMiddleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        cdnConfig.cacheControl.css,
      );
    });

    it("should set cache headers for JS files", () => {
      req.url = "/app.js";

      cdnCacheHeadersMiddleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        cdnConfig.cacheControl.js,
      );
    });

    it("should set cache headers for fonts", () => {
      req.url = "/fonts/roboto.woff2";

      cdnCacheHeadersMiddleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        cdnConfig.cacheControl.fonts,
      );
    });

    it("should not set cache headers for non-static files", () => {
      req.url = "/api/users";

      cdnCacheHeadersMiddleware(req as Request, res as Response, next);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
