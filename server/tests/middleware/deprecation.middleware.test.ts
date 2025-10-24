/**
 * Tests for Deprecation Middleware
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { logger } from "../../logger";
import { deprecated } from "../../middleware/deprecation.middleware";
import type { Request, Response, NextFunction } from "express";

// Mock logger
jest.mock("../../logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe("Deprecation Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      path: "/api/events/create",
      method: "POST",
      ip: "127.0.0.1",
      get: jest.fn((header: string) => {
        if (header === "User-Agent") return "Test-Agent/1.0";
        return undefined;
      }) as any,
    };

    res = {
      setHeader: jest.fn(),
    };

    next = jest.fn();

    // Clear mocks
    jest.clearAllMocks();
  });

  it("should set deprecation headers", () => {
    const middleware = deprecated("2024-12-31", "/api/v1/events");

    middleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith("Deprecation", "true");
    expect(res.setHeader).toHaveBeenCalledWith("Sunset", "2024-12-31");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Link",
      '</api/v1/events>; rel="alternate"',
    );
  });

  it("should log deprecation warning with correct details", () => {
    const middleware = deprecated("2024-12-31", "/api/v1/events");

    middleware(req as Request, res as Response, next);

    expect(logger.warn).toHaveBeenCalledWith("Deprecated endpoint called", {
      path: "/api/events/create",
      method: "POST",
      client: "Test-Agent/1.0",
      ip: "127.0.0.1",
      sunsetDate: "2024-12-31",
      newEndpoint: "/api/v1/events",
    });
  });

  it("should call next middleware", () => {
    const middleware = deprecated("2024-12-31", "/api/v1/events");

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should handle missing User-Agent header", () => {
    req.get = jest.fn(() => undefined) as any;

    const middleware = deprecated("2024-12-31", "/api/v1/events");

    middleware(req as Request, res as Response, next);

    expect(logger.warn).toHaveBeenCalledWith("Deprecated endpoint called", {
      path: "/api/events/create",
      method: "POST",
      client: undefined,
      ip: "127.0.0.1",
      sunsetDate: "2024-12-31",
      newEndpoint: "/api/v1/events",
    });
  });

  it("should work with different sunset dates", () => {
    const middleware = deprecated("2025-06-30", "/api/v2/events");

    middleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith("Sunset", "2025-06-30");
  });

  it("should work with different new endpoints", () => {
    const middleware = deprecated("2024-12-31", "/api/v3/events/new");

    middleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Link",
      '</api/v3/events/new>; rel="alternate"',
    );
  });
});
