/**
 * Tests for API Utilities
 * Coverage target: 85% based on utility component type
 *
 * This test suite validates all API utility functions including:
 * - Pagination parameter parsing
 * - Sort parameter parsing
 * - Filter parameter parsing
 * - Query parameter parsing (boolean, int, array, date)
 * - Response helpers (success, error, paginated)
 * - Validation helpers
 * - Query string building
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  parseBooleanParam,
  parseIntParam,
  parseArrayParam,
  parseDateRangeParams,
  parseSearchQuery,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendNoContent,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendBadRequest,
  sendInternalError,
  buildPaginationMeta,
  getUserIdFromRequest,
  getOptionalUserIdFromRequest,
  validateRequiredFields,
  buildQueryString,
  asyncHandler,
  isAuthenticated,
  getClientIp,
  buildPaginationLinks,
  PAGINATION_DEFAULTS,
} from "./api.utils";
import type { Request, Response } from "express";

// Helper to create mock Request
function createMockRequest(query: Record<string, any> = {}): Partial<Request> {
  return {
    query,
    headers: {},
    method: "GET",
    path: "/test",
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" } as any,
    get: jest.fn(),
  } as Partial<Request>;
}

// Helper to create mock Response
function createMockResponse(): Partial<Response> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as Partial<Response>;
  return res;
}

describe("API Utilities", () => {
  describe("happy path", () => {
    describe("parsePaginationParams", () => {
      it("should return default values when no query params provided", () => {
        // Arrange
        const req = createMockRequest();

        // Act
        const result = parsePaginationParams(req as Request);

        // Assert
        expect(result).toEqual({
          page: 1,
          limit: 50,
          offset: 0,
        });
      });

      it("should parse valid pagination parameters", () => {
        // Arrange
        const req = createMockRequest({ page: "2", limit: "25" });

        // Act
        const result = parsePaginationParams(req as Request);

        // Assert
        expect(result).toEqual({
          page: 2,
          limit: 25,
          offset: 25,
        });
      });

      it("should cap limit at maximum value", () => {
        // Arrange
        const req = createMockRequest({ page: "1", limit: "200" });

        // Act
        const result = parsePaginationParams(req as Request);

        // Assert
        expect(result.limit).toBe(PAGINATION_DEFAULTS.maxLimit);
      });

      it("should ensure minimum page of 1", () => {
        // Arrange
        const req = createMockRequest({ page: "0", limit: "10" });

        // Act
        const result = parsePaginationParams(req as Request);

        // Assert
        expect(result.page).toBe(1);
      });

      it("should calculate offset correctly", () => {
        // Arrange
        const req = createMockRequest({ page: "3", limit: "10" });

        // Act
        const result = parsePaginationParams(req as Request);

        // Assert
        expect(result.offset).toBe(20); // (3-1) * 10
      });
    });

    describe("parseSortParams", () => {
      it("should return default values when no query params provided", () => {
        // Arrange
        const req = createMockRequest();

        // Act
        const result = parseSortParams(req as Request);

        // Assert
        expect(result).toEqual({
          field: "createdAt",
          direction: "desc",
        });
      });

      it("should parse valid sort parameters", () => {
        // Arrange
        const req = createMockRequest({ sortBy: "name", order: "asc" });

        // Act
        const result = parseSortParams(req as Request);

        // Assert
        expect(result).toEqual({
          field: "name",
          direction: "asc",
        });
      });

      it("should use custom defaults when provided", () => {
        // Arrange
        const req = createMockRequest();

        // Act
        const result = parseSortParams(req as Request, "updatedAt", "asc");

        // Assert
        expect(result).toEqual({
          field: "updatedAt",
          direction: "asc",
        });
      });
    });

    describe("parseFilterParams", () => {
      it("should parse allowed filters", () => {
        // Arrange
        const req = createMockRequest({
          status: "active",
          category: "general",
        });
        const allowedFilters = ["status", "category"];

        // Act
        const result = parseFilterParams(req as Request, allowedFilters);

        // Assert
        expect(result).toEqual({
          status: "active",
          category: "general",
        });
      });

      it("should ignore non-allowed filters", () => {
        // Arrange
        const req = createMockRequest({
          status: "active",
          malicious: "value",
        });
        const allowedFilters = ["status"];

        // Act
        const result = parseFilterParams(req as Request, allowedFilters);

        // Assert
        expect(result).toEqual({
          status: "active",
        });
        expect(result).not.toHaveProperty("malicious");
      });

      it("should parse comma-separated values as arrays", () => {
        // Arrange
        const req = createMockRequest({
          tags: "tag1,tag2,tag3",
        });
        const allowedFilters = ["tags"];

        // Act
        const result = parseFilterParams(req as Request, allowedFilters);

        // Assert
        expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
      });

      it("should ignore empty values", () => {
        // Arrange
        const req = createMockRequest({
          status: "active",
          empty: "",
        });
        const allowedFilters = ["status", "empty"];

        // Act
        const result = parseFilterParams(req as Request, allowedFilters);

        // Assert
        expect(result).toEqual({
          status: "active",
        });
      });
    });

    describe("parseBooleanParam", () => {
      it("should parse 'true' string as boolean true", () => {
        // Arrange
        const req = createMockRequest({ flag: "true" });

        // Act
        const result = parseBooleanParam(req as Request, "flag");

        // Assert
        expect(result).toBe(true);
      });

      it("should parse '1' string as boolean true", () => {
        // Arrange
        const req = createMockRequest({ flag: "1" });

        // Act
        const result = parseBooleanParam(req as Request, "flag");

        // Assert
        expect(result).toBe(true);
      });

      it("should parse other strings as false", () => {
        // Arrange
        const req = createMockRequest({ flag: "false" });

        // Act
        const result = parseBooleanParam(req as Request, "flag");

        // Assert
        expect(result).toBe(false);
      });

      it("should return default value when param not provided", () => {
        // Arrange
        const req = createMockRequest({});

        // Act
        const result = parseBooleanParam(req as Request, "flag", true);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("parseIntParam", () => {
      it("should parse valid integer string", () => {
        // Arrange
        const req = createMockRequest({ count: "42" });

        // Act
        const result = parseIntParam(req as Request, "count");

        // Assert
        expect(result).toBe(42);
      });

      it("should return default value for invalid integer", () => {
        // Arrange
        const req = createMockRequest({ count: "not-a-number" });

        // Act
        const result = parseIntParam(req as Request, "count", 10);

        // Assert
        expect(result).toBe(10);
      });

      it("should return default value when param not provided", () => {
        // Arrange
        const req = createMockRequest({});

        // Act
        const result = parseIntParam(req as Request, "count", 5);

        // Assert
        expect(result).toBe(5);
      });
    });

    describe("parseArrayParam", () => {
      it("should parse comma-separated string", () => {
        // Arrange
        const req = createMockRequest({ ids: "1,2,3" });

        // Act
        const result = parseArrayParam(req as Request, "ids");

        // Assert
        expect(result).toEqual(["1", "2", "3"]);
      });

      it("should handle array parameter", () => {
        // Arrange
        const req = createMockRequest({ ids: ["1", "2", "3"] });

        // Act
        const result = parseArrayParam(req as Request, "ids");

        // Assert
        expect(result).toEqual(["1", "2", "3"]);
      });

      it("should return default value when param not provided", () => {
        // Arrange
        const req = createMockRequest({});

        // Act
        const result = parseArrayParam(req as Request, "ids", ["default"]);

        // Assert
        expect(result).toEqual(["default"]);
      });

      it("should trim whitespace from array values", () => {
        // Arrange
        const req = createMockRequest({ ids: " 1 , 2 , 3 " });

        // Act
        const result = parseArrayParam(req as Request, "ids");

        // Assert
        expect(result).toEqual(["1", "2", "3"]);
      });
    });

    describe("parseDateRangeParams", () => {
      it("should parse valid date range", () => {
        // Arrange
        const startDate = "2024-01-01";
        const endDate = "2024-12-31";
        const req = createMockRequest({ startDate, endDate });

        // Act
        const result = parseDateRangeParams(req as Request);

        // Assert
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.startDate?.toISOString()).toContain("2024-01-01");
        expect(result.endDate?.toISOString()).toContain("2024-12-31");
      });

      it("should handle only start date", () => {
        // Arrange
        const req = createMockRequest({ startDate: "2024-01-01" });

        // Act
        const result = parseDateRangeParams(req as Request);

        // Assert
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeUndefined();
      });

      it("should ignore invalid dates", () => {
        // Arrange
        const req = createMockRequest({ startDate: "invalid-date" });

        // Act
        const result = parseDateRangeParams(req as Request);

        // Assert
        expect(result.startDate).toBeUndefined();
      });
    });

    describe("parseSearchQuery", () => {
      it("should parse 'q' parameter", () => {
        // Arrange
        const req = createMockRequest({ q: "search term" });

        // Act
        const result = parseSearchQuery(req as Request);

        // Assert
        expect(result).toBe("search term");
      });

      it("should parse 'search' parameter", () => {
        // Arrange
        const req = createMockRequest({ search: "search term" });

        // Act
        const result = parseSearchQuery(req as Request);

        // Assert
        expect(result).toBe("search term");
      });

      it("should parse 'query' parameter", () => {
        // Arrange
        const req = createMockRequest({ query: "search term" });

        // Act
        const result = parseSearchQuery(req as Request);

        // Assert
        expect(result).toBe("search term");
      });

      it("should return undefined when no search param provided", () => {
        // Arrange
        const req = createMockRequest({});

        // Act
        const result = parseSearchQuery(req as Request);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe("response helpers", () => {
      it("sendSuccess should send 200 success response", () => {
        // Arrange
        const res = createMockResponse();
        const data = { id: "123", name: "Test" };

        // Act
        sendSuccess(res as Response, data, "Success message");

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
      });

      it("sendPaginatedSuccess should send paginated response", () => {
        // Arrange
        const res = createMockResponse();
        const data = [{ id: "1" }, { id: "2" }];
        const pagination = { page: 1, limit: 10, total: 50 };

        // Act
        sendPaginatedSuccess(res as Response, data, pagination);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
      });

      it("sendCreated should send 201 created response", () => {
        // Arrange
        const res = createMockResponse();
        const data = { id: "123" };

        // Act
        sendCreated(res as Response, data);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it("sendNoContent should send 204 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendNoContent(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
      });

      it("sendError should send error response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendError(res as Response, "Error occurred", 500);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalled();
      });

      it("sendValidationError should send 400 validation error", () => {
        // Arrange
        const res = createMockResponse();
        const errors = [{ field: "email", message: "Invalid email" }];

        // Act
        sendValidationError(res as Response, errors);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("sendNotFound should send 404 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendNotFound(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
      });

      it("sendUnauthorized should send 401 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendUnauthorized(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
      });

      it("sendForbidden should send 403 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendForbidden(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
      });

      it("sendConflict should send 409 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendConflict(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(409);
      });

      it("sendBadRequest should send 400 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendBadRequest(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("sendInternalError should send 500 response", () => {
        // Arrange
        const res = createMockResponse();

        // Act
        sendInternalError(res as Response);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe("buildPaginationMeta", () => {
      it("should build correct pagination metadata", () => {
        // Act
        const result = buildPaginationMeta(2, 10, 50);

        // Assert
        expect(result).toEqual({
          page: 2,
          limit: 10,
          total: 50,
          totalPages: 5,
        });
      });

      it("should calculate total pages correctly", () => {
        // Act
        const result = buildPaginationMeta(1, 10, 15);

        // Assert
        expect(result.totalPages).toBe(2);
      });

      it("should handle zero total correctly", () => {
        // Act
        const result = buildPaginationMeta(1, 10, 0);

        // Assert
        expect(result.totalPages).toBe(0);
      });
    });

    describe("getUserIdFromRequest", () => {
      it("should extract userId from request", () => {
        // Arrange
        const req = {
          ...createMockRequest(),
          userId: "user-123",
        } as any;

        // Act
        const result = getUserIdFromRequest(req);

        // Assert
        expect(result).toBe("user-123");
      });

      it("should extract user ID from user object", () => {
        // Arrange
        const req = {
          ...createMockRequest(),
          user: { id: "user-456" },
        } as any;

        // Act
        const result = getUserIdFromRequest(req);

        // Assert
        expect(result).toBe("user-456");
      });

      it("should extract user ID from headers", () => {
        // Arrange
        const req = {
          ...createMockRequest(),
          headers: { "x-user-id": "user-789" },
        } as any;

        // Act
        const result = getUserIdFromRequest(req);

        // Assert
        expect(result).toBe("user-789");
      });
    });

    describe("validateRequiredFields", () => {
      it("should validate all required fields present", () => {
        // Arrange
        const body = { name: "Test", email: "test@example.com" };
        const requiredFields = ["name", "email"];

        // Act
        const result = validateRequiredFields(body, requiredFields);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.missing).toEqual([]);
      });

      it("should identify missing required fields", () => {
        // Arrange
        const body = { name: "Test" };
        const requiredFields = ["name", "email", "password"];

        // Act
        const result = validateRequiredFields(body, requiredFields);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.missing).toEqual(["email", "password"]);
      });

      it("should treat empty string as missing", () => {
        // Arrange
        const body = { name: "", email: "test@example.com" };
        const requiredFields = ["name", "email"];

        // Act
        const result = validateRequiredFields(body, requiredFields);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.missing).toContain("name");
      });
    });

    describe("buildQueryString", () => {
      it("should build query string from params", () => {
        // Arrange
        const params = { page: 1, limit: 10, status: "active" };

        // Act
        const result = buildQueryString(params);

        // Assert
        expect(result).toBe("?page=1&limit=10&status=active");
      });

      it("should handle array values", () => {
        // Arrange
        const params = { tags: ["tag1", "tag2"] };

        // Act
        const result = buildQueryString(params);

        // Assert
        expect(result).toContain("tags=tag1");
        expect(result).toContain("tags=tag2");
      });

      it("should ignore null and undefined values", () => {
        // Arrange
        const params = { page: 1, status: null, filter: undefined };

        // Act
        const result = buildQueryString(params);

        // Assert
        expect(result).toBe("?page=1");
      });

      it("should return empty string for empty params", () => {
        // Arrange
        const params = {};

        // Act
        const result = buildQueryString(params);

        // Assert
        expect(result).toBe("");
      });
    });

    describe("isAuthenticated", () => {
      it("should return true when userId exists", () => {
        // Arrange
        const req = { ...createMockRequest(), userId: "user-123" } as any;

        // Act
        const result = isAuthenticated(req);

        // Assert
        expect(result).toBe(true);
      });

      it("should return true when user.id exists", () => {
        // Arrange
        const req = {
          ...createMockRequest(),
          user: { id: "user-123" },
        } as any;

        // Act
        const result = isAuthenticated(req);

        // Assert
        expect(result).toBe(true);
      });

      it("should return false when not authenticated", () => {
        // Arrange
        const req = createMockRequest() as any;

        // Act
        const result = isAuthenticated(req);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe("getClientIp", () => {
      it("should extract IP from x-forwarded-for header", () => {
        // Arrange
        const req = {
          ...createMockRequest(),
          headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
        } as any;

        // Act
        const result = getClientIp(req);

        // Assert
        expect(result).toBe("192.168.1.1");
      });

      it("should fall back to socket.remoteAddress", () => {
        // Arrange
        const req = createMockRequest() as any;

        // Act
        const result = getClientIp(req);

        // Assert
        expect(result).toBe("127.0.0.1");
      });
    });

    describe("buildPaginationLinks", () => {
      it("should build pagination links", () => {
        // Arrange
        const baseUrl = "/api/users";
        const page = 2;
        const totalPages = 5;

        // Act
        const result = buildPaginationLinks(baseUrl, page, totalPages);

        // Assert
        expect(result.first).toBeDefined();
        expect(result.prev).toBeDefined();
        expect(result.next).toBeDefined();
        expect(result.last).toBeDefined();
      });

      it("should not include first/prev on first page", () => {
        // Arrange
        const baseUrl = "/api/users";
        const page = 1;
        const totalPages = 5;

        // Act
        const result = buildPaginationLinks(baseUrl, page, totalPages);

        // Assert
        expect(result.first).toBeUndefined();
        expect(result.prev).toBeUndefined();
        expect(result.next).toBeDefined();
      });

      it("should not include next/last on last page", () => {
        // Arrange
        const baseUrl = "/api/users";
        const page = 5;
        const totalPages = 5;

        // Act
        const result = buildPaginationLinks(baseUrl, page, totalPages);

        // Assert
        expect(result.first).toBeDefined();
        expect(result.prev).toBeDefined();
        expect(result.next).toBeUndefined();
        expect(result.last).toBeUndefined();
      });
    });
  });

  describe("error handling", () => {
    it("getUserIdFromRequest should throw when user ID not found", () => {
      // Arrange
      const req = createMockRequest() as any;

      // Act & Assert
      expect(() => getUserIdFromRequest(req)).toThrow("User ID not found");
    });

    it("getOptionalUserIdFromRequest should return undefined on error", () => {
      // Arrange
      const req = createMockRequest() as any;

      // Act
      const result = getOptionalUserIdFromRequest(req);

      // Assert
      expect(result).toBeUndefined();
    });

    it("asyncHandler should catch and handle errors", async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const errorFn = jest.fn().mockRejectedValue(new Error("Test error"));
      const handler = asyncHandler(errorFn);

      // Act
      handler(req, res);

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("edge cases", () => {
    it("parsePaginationParams should handle negative page numbers", () => {
      // Arrange
      const req = createMockRequest({ page: "-5", limit: "10" });

      // Act
      const result = parsePaginationParams(req as Request);

      // Assert
      expect(result.page).toBe(1);
    });

    it("parsePaginationParams should handle non-numeric values", () => {
      // Arrange
      const req = createMockRequest({ page: "abc", limit: "xyz" });

      // Act
      const result = parsePaginationParams(req as Request);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it("parseArrayParam should filter empty strings", () => {
      // Arrange
      const req = createMockRequest({ ids: "1,,2,,3" });

      // Act
      const result = parseArrayParam(req as Request, "ids");

      // Assert
      expect(result).toEqual(["1", "2", "3"]);
    });

    it("buildQueryString should handle special characters", () => {
      // Arrange
      const params = { query: "hello world", filter: "a&b" };

      // Act
      const result = buildQueryString(params);

      // Assert
      expect(result).toContain("hello+world");
      expect(result).toContain("a%26b");
    });

    it("validateRequiredFields should treat null as missing", () => {
      // Arrange
      const body = { name: null, email: "test@example.com" };
      const requiredFields = ["name", "email"];

      // Act
      const result = validateRequiredFields(body, requiredFields);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("name");
    });
  });
});
