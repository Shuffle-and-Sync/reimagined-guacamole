/**
 * Tests for ApiResponse utility
 */

import { ApiResponse } from "../../utils/ApiResponse";

describe("ApiResponse", () => {
  describe("success()", () => {
    test("should create a success response with data", () => {
      const data = { id: "123", name: "Test User" };
      const response = ApiResponse.success(data);

      expect(response.status).toBe("success");
      expect(response.data).toEqual(data);
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.requestId).toBeDefined();
      expect(response.meta?.requestId).toMatch(/^req_/);
    });

    test("should include optional message", () => {
      const data = { id: "123" };
      const message = "User created successfully";
      const response = ApiResponse.success(data, message);

      expect(response.status).toBe("success");
      expect(response.message).toBe(message);
    });

    test("should include custom meta information", () => {
      const data = { id: "123" };
      const customMeta = { requestId: "custom-req-id" };
      const response = ApiResponse.success(data, undefined, customMeta);

      expect(response.meta?.requestId).toBe("custom-req-id");
      expect(response.meta?.timestamp).toBeDefined();
    });
  });

  describe("fail()", () => {
    test("should create a fail response for client errors", () => {
      const message = "Invalid email format";
      const response = ApiResponse.fail(message);

      expect(response.status).toBe("fail");
      expect(response.message).toBe(message);
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.requestId).toBeDefined();
    });

    test("should include validation errors", () => {
      const message = "Validation failed";
      const errors = [
        { field: "email", message: "Invalid email", code: "INVALID_EMAIL" },
        { field: "password", message: "Too short", code: "INVALID_LENGTH" },
      ];
      const response = ApiResponse.fail(message, errors);

      expect(response.status).toBe("fail");
      expect(response.errors).toEqual(errors);
      expect(response.errors).toHaveLength(2);
    });
  });

  describe("error()", () => {
    test("should create an error response for server errors", () => {
      const message = "Internal server error";
      const response = ApiResponse.error(message);

      expect(response.status).toBe("error");
      expect(response.message).toBe(message);
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.requestId).toBeDefined();
    });

    test("should include error details", () => {
      const message = "Database connection failed";
      const errors = [{ message: "Connection timeout", code: "DB_TIMEOUT" }];
      const response = ApiResponse.error(message, errors);

      expect(response.status).toBe("error");
      expect(response.errors).toEqual(errors);
    });
  });

  describe("paginated()", () => {
    test("should create a paginated success response", () => {
      const data = [
        { id: "1", name: "User 1" },
        { id: "2", name: "User 2" },
      ];
      const pagination = { page: 1, limit: 10, total: 25 };
      const response = ApiResponse.paginated(data, pagination);

      expect(response.status).toBe("success");
      expect(response.data).toEqual(data);
      expect(response.meta?.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should calculate totalPages correctly", () => {
      const data = [{ id: "1" }];
      const pagination = { page: 1, limit: 20, total: 100 };
      const response = ApiResponse.paginated(data, pagination);

      expect(response.meta?.pagination?.totalPages).toBe(5);
    });

    test("should handle edge case with exact page match", () => {
      const data = [{ id: "1" }];
      const pagination = { page: 1, limit: 10, total: 10 };
      const response = ApiResponse.paginated(data, pagination);

      expect(response.meta?.pagination?.totalPages).toBe(1);
    });

    test("should include optional message", () => {
      const data = [{ id: "1" }];
      const pagination = { page: 1, limit: 10, total: 1 };
      const message = "Users retrieved successfully";
      const response = ApiResponse.paginated(data, pagination, message);

      expect(response.message).toBe(message);
    });
  });

  describe("requestId generation", () => {
    test("should generate unique request IDs", () => {
      const response1 = ApiResponse.success({ test: 1 });
      const response2 = ApiResponse.success({ test: 2 });

      expect(response1.meta?.requestId).not.toBe(response2.meta?.requestId);
    });

    test("should follow request ID format", () => {
      const response = ApiResponse.success({ test: 1 });
      const requestId = response.meta?.requestId;

      expect(requestId).toMatch(/^req_\d+_[a-zA-Z0-9]+$/);
    });
  });

  describe("timestamp", () => {
    test("should include valid ISO timestamp", () => {
      const response = ApiResponse.success({ test: 1 });
      const timestamp = response.meta?.timestamp;

      expect(timestamp).toBeDefined();
      expect(() => new Date(timestamp!)).not.toThrow();
      expect(new Date(timestamp!).toISOString()).toBe(timestamp);
    });
  });
});
