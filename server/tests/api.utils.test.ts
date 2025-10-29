/**
 * Tests for API utilities
 */

import {
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  parseBooleanParam,
  parseIntParam,
  parseArrayParam,
  parseDateRangeParams,
  buildPaginationMeta,
  getUserIdFromRequest,
  getOptionalUserIdFromRequest,
  validateRequiredFields,
  buildQueryString,
  buildPaginationLinks,
  parseSearchQuery,
  getClientIp,
} from "../utils/api.utils";
import type { Request, Response } from "express";

// Mock Express Request and Response
const createMockRequest = (
  query: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Partial<Request> => ({
  query,
  headers,
  socket: { remoteAddress: "127.0.0.1" } as any,
});

describe("api.utils", () => {
  describe("parsePaginationParams", () => {
    it("should parse pagination with defaults", () => {
      const req = createMockRequest({});
      const result = parsePaginationParams(req as Request);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should parse custom pagination", () => {
      const req = createMockRequest({ page: "2", limit: "25" });
      const result = parsePaginationParams(req as Request);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(25);
    });

    it("should enforce max limit", () => {
      const req = createMockRequest({ limit: "200" });
      const result = parsePaginationParams(req as Request);
      expect(result.limit).toBe(100);
    });

    it("should handle invalid values", () => {
      const req = createMockRequest({ page: "invalid", limit: "invalid" });
      const result = parsePaginationParams(req as Request);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it("should handle negative values", () => {
      const req = createMockRequest({ page: "-1", limit: "0" });
      const result = parsePaginationParams(req as Request);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50); // limit 0 gets clamped to max(1, 0) then min(50, 1) = 1, but Math.min(50, 1) = 1, then we have default logic
    });
  });

  describe("parseSortParams", () => {
    it("should parse sort with defaults", () => {
      const req = createMockRequest({});
      const result = parseSortParams(req as Request);
      expect(result.field).toBe("createdAt");
      expect(result.direction).toBe("desc");
    });

    it("should parse custom sort", () => {
      const req = createMockRequest({ sortBy: "name", order: "asc" });
      const result = parseSortParams(req as Request);
      expect(result.field).toBe("name");
      expect(result.direction).toBe("asc");
    });

    it("should default to desc for invalid order", () => {
      const req = createMockRequest({ sortBy: "name", order: "invalid" });
      const result = parseSortParams(req as Request);
      expect(result.direction).toBe("desc");
    });
  });

  describe("parseFilterParams", () => {
    it("should parse allowed filters", () => {
      const req = createMockRequest({ status: "active", type: "user" });
      const result = parseFilterParams(req as Request, ["status", "type"]);
      expect(result).toEqual({ status: "active", type: "user" });
    });

    it("should ignore non-allowed filters", () => {
      const req = createMockRequest({
        status: "active",
        unauthorized: "value",
      });
      const result = parseFilterParams(req as Request, ["status"]);
      expect(result).toEqual({ status: "active" });
    });

    it("should parse comma-separated values as arrays", () => {
      const req = createMockRequest({ tags: "tag1,tag2,tag3" });
      const result = parseFilterParams(req as Request, ["tags"]);
      expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should skip empty values", () => {
      const req = createMockRequest({ status: "", type: "user" });
      const result = parseFilterParams(req as Request, ["status", "type"]);
      expect(result).toEqual({ type: "user" });
    });
  });

  describe("parseBooleanParam", () => {
    it("should parse boolean values", () => {
      expect(
        parseBooleanParam(
          createMockRequest({ active: "true" }) as Request,
          "active",
        ),
      ).toBe(true);
      expect(
        parseBooleanParam(
          createMockRequest({ active: "false" }) as Request,
          "active",
        ),
      ).toBe(false);
      expect(
        parseBooleanParam(
          createMockRequest({ active: "1" }) as Request,
          "active",
        ),
      ).toBe(true);
    });

    it("should use default value when parameter is missing", () => {
      expect(
        parseBooleanParam(createMockRequest() as Request, "active", true),
      ).toBe(true);
      expect(
        parseBooleanParam(createMockRequest() as Request, "active", false),
      ).toBe(false);
    });

    it("should handle invalid boolean values", () => {
      expect(
        parseBooleanParam(
          createMockRequest({ active: "invalid" }) as Request,
          "active",
          false,
        ),
      ).toBe(false);
    });
  });

  describe("parseIntParam", () => {
    it("should parse integer values", () => {
      expect(
        parseIntParam(createMockRequest({ count: "42" }) as Request, "count"),
      ).toBe(42);
    });

    it("should use default value when parameter is missing", () => {
      expect(parseIntParam(createMockRequest() as Request, "count", 10)).toBe(
        10,
      );
    });

    it("should handle invalid integer values", () => {
      expect(
        parseIntParam(
          createMockRequest({ count: "invalid" }) as Request,
          "count",
          0,
        ),
      ).toBe(0);
    });
  });

  describe("parseArrayParam", () => {
    it("should parse comma-separated values", () => {
      const req = createMockRequest({ tags: "a,b,c" });
      expect(parseArrayParam(req as Request, "tags")).toEqual(["a", "b", "c"]);
    });

    it("should handle array values", () => {
      const req = createMockRequest({ tags: ["a", "b", "c"] });
      expect(parseArrayParam(req as Request, "tags")).toEqual(["a", "b", "c"]);
    });

    it("should use default value when parameter is missing", () => {
      const req = createMockRequest();
      expect(parseArrayParam(req as Request, "tags", ["default"])).toEqual([
        "default",
      ]);
    });

    it("should trim whitespace from values", () => {
      const req = createMockRequest({ tags: "  a  ,  b  ,  c  " });
      expect(parseArrayParam(req as Request, "tags")).toEqual(["a", "b", "c"]);
    });
  });

  describe("parseDateRangeParams", () => {
    it("should parse valid date range", () => {
      const req = createMockRequest({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      const result = parseDateRangeParams(req as Request);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it("should handle missing dates", () => {
      const req = createMockRequest();
      const result = parseDateRangeParams(req as Request);
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it("should handle invalid dates", () => {
      const req = createMockRequest({
        startDate: "invalid",
        endDate: "invalid",
      });
      const result = parseDateRangeParams(req as Request);
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });
  });

  describe("buildPaginationMeta", () => {
    it("should build pagination metadata", () => {
      const meta = buildPaginationMeta(2, 25, 100);
      expect(meta).toEqual({
        page: 2,
        limit: 25,
        total: 100,
        totalPages: 4,
      });
    });

    it("should handle edge cases", () => {
      const meta = buildPaginationMeta(1, 50, 0);
      expect(meta.totalPages).toBe(0);
    });

    it("should round up total pages", () => {
      const meta = buildPaginationMeta(1, 25, 30);
      expect(meta.totalPages).toBe(2);
    });
  });

  describe("getUserIdFromRequest", () => {
    it("should extract userId from request", () => {
      const req = { userId: "user-123" } as any;
      expect(getUserIdFromRequest(req)).toBe("user-123");
    });

    it("should extract userId from user object", () => {
      const req = { user: { id: "user-456" } } as any;
      expect(getUserIdFromRequest(req)).toBe("user-456");
    });

    it("should extract userId from headers", () => {
      const req = createMockRequest({}, { "x-user-id": "user-789" });
      expect(getUserIdFromRequest(req as Request)).toBe("user-789");
    });

    it("should throw error when userId not found", () => {
      const req = createMockRequest();
      expect(() => getUserIdFromRequest(req as Request)).toThrow();
    });
  });

  describe("getOptionalUserIdFromRequest", () => {
    it("should return userId when present", () => {
      const req = { userId: "user-123" } as any;
      expect(getOptionalUserIdFromRequest(req)).toBe("user-123");
    });

    it("should return undefined when userId not found", () => {
      const req = createMockRequest();
      expect(getOptionalUserIdFromRequest(req as Request)).toBeUndefined();
    });
  });

  describe("validateRequiredFields", () => {
    it("should validate all required fields present", () => {
      const body = { name: "Test", email: "test@example.com" };
      const result = validateRequiredFields(body, ["name", "email"]);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("should detect missing fields", () => {
      const body = { name: "Test" };
      const result = validateRequiredFields(body, ["name", "email"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["email"]);
    });

    it("should detect empty string as missing", () => {
      const body = { name: "", email: "test@example.com" };
      const result = validateRequiredFields(body, ["name", "email"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["name"]);
    });

    it("should detect null as missing", () => {
      const body = { name: null, email: "test@example.com" };
      const result = validateRequiredFields(body, ["name", "email"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["name"]);
    });
  });

  describe("buildQueryString", () => {
    it("should build query string from params", () => {
      const params = { page: 2, limit: 25, status: "active" };
      const result = buildQueryString(params);
      expect(result).toBe("?page=2&limit=25&status=active");
    });

    it("should handle array values", () => {
      const params = { tags: ["a", "b", "c"] };
      const result = buildQueryString(params);
      expect(result).toContain("tags=a");
      expect(result).toContain("tags=b");
      expect(result).toContain("tags=c");
    });

    it("should skip null and undefined values", () => {
      const params = { page: 1, empty: null, missing: undefined };
      const result = buildQueryString(params);
      expect(result).toBe("?page=1");
    });

    it("should return empty string for no params", () => {
      const result = buildQueryString({});
      expect(result).toBe("");
    });
  });

  describe("buildPaginationLinks", () => {
    it("should build pagination links", () => {
      const links = buildPaginationLinks("/api/users", 2, 5);
      expect(links.first).toBeDefined();
      expect(links.prev).toBeDefined();
      expect(links.next).toBeDefined();
      expect(links.last).toBeDefined();
    });

    it("should not include first/prev for page 1", () => {
      const links = buildPaginationLinks("/api/users", 1, 5);
      expect(links.first).toBeUndefined();
      expect(links.prev).toBeUndefined();
      expect(links.next).toBeDefined();
      expect(links.last).toBeDefined();
    });

    it("should not include next/last for last page", () => {
      const links = buildPaginationLinks("/api/users", 5, 5);
      expect(links.first).toBeDefined();
      expect(links.prev).toBeDefined();
      expect(links.next).toBeUndefined();
      expect(links.last).toBeUndefined();
    });

    it("should include additional params in links", () => {
      const links = buildPaginationLinks("/api/users", 2, 5, {
        status: "active",
      });
      expect(links.next).toContain("status=active");
    });
  });

  describe("parseSearchQuery", () => {
    it("should parse search query", () => {
      expect(
        parseSearchQuery(createMockRequest({ q: "test" }) as Request),
      ).toBe("test");
      expect(
        parseSearchQuery(createMockRequest({ search: "test" }) as Request),
      ).toBe("test");
      expect(
        parseSearchQuery(createMockRequest({ query: "test" }) as Request),
      ).toBe("test");
    });

    it("should return undefined when no query", () => {
      expect(parseSearchQuery(createMockRequest() as Request)).toBeUndefined();
    });

    it("should trim whitespace", () => {
      expect(
        parseSearchQuery(createMockRequest({ q: "  test  " }) as Request),
      ).toBe("test");
    });
  });

  describe("getClientIp", () => {
    it("should get IP from x-forwarded-for header", () => {
      const req = createMockRequest(
        {},
        { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      );
      expect(getClientIp(req as Request)).toBe("192.168.1.1");
    });

    it("should fall back to socket remote address", () => {
      const req = createMockRequest();
      expect(getClientIp(req as Request)).toBe("127.0.0.1");
    });

    it("should return 'unknown' when no IP available", () => {
      const req = { socket: {}, headers: {} } as any;
      expect(getClientIp(req)).toBe("unknown");
    });
  });
});
