/**
 * Comprehensive Zod Schema Validation Tests
 *
 * Tests all Zod validation schemas for proper error handling
 * across user input, tournaments, events, messages, and more.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { globalErrorHandler } from "../../../middleware/error-handling.middleware";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  createZodError,
  errorAssertions,
} from "../../helpers/error-test-utils";

describe("Zod Validation Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/test",
      method: "POST",
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  describe("Email Validation", () => {
    const emailSchema = z.object({
      email: z.string().email(),
    });

    test("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
        "double@@domain.com",
      ];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse({ email })).toThrow(ZodError);
      });
    });

    test("should handle email validation error through error handler", () => {
      const zodError = createZodError([
        { path: ["email"], message: "Invalid email" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      errorAssertions.expectValidationError(error, "email");
      expect(error.error.details.validationErrors[0].message).toBe(
        "Invalid email",
      );
    });

    test("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "test.user@domain.co.uk",
        "user+tag@example.com",
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse({ email })).not.toThrow();
      });
    });
  });

  describe("Username Validation", () => {
    const usernameSchema = z.object({
      username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_-]+$/),
    });

    test("should reject username too short", () => {
      expect(() => usernameSchema.parse({ username: "ab" })).toThrow(ZodError);
    });

    test("should reject username too long", () => {
      const longUsername = "a".repeat(31);
      expect(() => usernameSchema.parse({ username: longUsername })).toThrow(
        ZodError,
      );
    });

    test("should reject username with invalid characters", () => {
      const invalidUsernames = [
        "user@name",
        "user name",
        "user.name",
        "user#name",
      ];

      invalidUsernames.forEach((username) => {
        expect(() => usernameSchema.parse({ username })).toThrow(ZodError);
      });
    });

    test("should accept valid usernames", () => {
      const validUsernames = ["user123", "test_user", "user-name", "ABC123"];

      validUsernames.forEach((username) => {
        expect(() => usernameSchema.parse({ username })).not.toThrow();
      });
    });
  });

  describe("Password Validation", () => {
    const passwordSchema = z.object({
      password: z.string().min(8).max(128),
    });

    test("should reject password too short", () => {
      expect(() => passwordSchema.parse({ password: "short" })).toThrow(
        ZodError,
      );
    });

    test("should reject password too long", () => {
      const longPassword = "a".repeat(129);
      expect(() => passwordSchema.parse({ password: longPassword })).toThrow(
        ZodError,
      );
    });

    test("should accept valid passwords", () => {
      const validPasswords = [
        "password123",
        "MyP@ssw0rd!",
        "VeryLongPasswordWith123Numbers",
      ];

      validPasswords.forEach((password) => {
        expect(() => passwordSchema.parse({ password })).not.toThrow();
      });
    });
  });

  describe("Tournament Validation", () => {
    const tournamentSchema = z.object({
      name: z.string().min(3).max(100),
      maxPlayers: z.number().int().min(2).max(128),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      format: z.enum(["Standard", "Modern", "Legacy", "Commander"]),
    });

    test("should reject invalid tournament name length", () => {
      expect(() =>
        tournamentSchema.parse({
          name: "ab",
          maxPlayers: 8,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          format: "Standard",
        }),
      ).toThrow(ZodError);
    });

    test("should reject invalid maxPlayers range", () => {
      expect(() =>
        tournamentSchema.parse({
          name: "Test Tournament",
          maxPlayers: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          format: "Standard",
        }),
      ).toThrow(ZodError);

      expect(() =>
        tournamentSchema.parse({
          name: "Test Tournament",
          maxPlayers: 200,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          format: "Standard",
        }),
      ).toThrow(ZodError);
    });

    test("should reject invalid date format", () => {
      expect(() =>
        tournamentSchema.parse({
          name: "Test Tournament",
          maxPlayers: 8,
          startDate: "not-a-date",
          endDate: new Date(Date.now() + 86400000).toISOString(),
          format: "Standard",
        }),
      ).toThrow(ZodError);
    });

    test("should reject invalid format enum", () => {
      expect(() =>
        tournamentSchema.parse({
          name: "Test Tournament",
          maxPlayers: 8,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          format: "InvalidFormat",
        }),
      ).toThrow(ZodError);
    });

    test("should handle multiple validation errors", () => {
      const zodError = createZodError([
        {
          path: ["name"],
          message: "String must contain at least 3 character(s)",
        },
        {
          path: ["maxPlayers"],
          message: "Number must be greater than or equal to 2",
        },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors).toHaveLength(2);
    });
  });

  describe("Date Range Validation", () => {
    const dateRangeSchema = z
      .object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
      .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
        message: "End date must be after start date",
        path: ["endDate"],
      });

    test("should reject end date before start date", () => {
      const startDate = new Date("2025-12-31").toISOString();
      const endDate = new Date("2025-01-01").toISOString();

      expect(() => dateRangeSchema.parse({ startDate, endDate })).toThrow(
        ZodError,
      );
    });

    test("should accept valid date range", () => {
      const startDate = new Date("2025-01-01").toISOString();
      const endDate = new Date("2025-12-31").toISOString();

      expect(() => dateRangeSchema.parse({ startDate, endDate })).not.toThrow();
    });
  });

  describe("Message Validation", () => {
    const messageSchema = z.object({
      content: z.string().min(1).max(2000),
      recipientId: z.string().uuid(),
    });

    test("should reject empty message content", () => {
      expect(() =>
        messageSchema.parse({
          content: "",
          recipientId: "123e4567-e89b-12d3-a456-426614174000",
        }),
      ).toThrow(ZodError);
    });

    test("should reject message content too long", () => {
      const longContent = "a".repeat(2001);
      expect(() =>
        messageSchema.parse({
          content: longContent,
          recipientId: "123e4567-e89b-12d3-a456-426614174000",
        }),
      ).toThrow(ZodError);
    });

    test("should reject invalid recipient UUID", () => {
      expect(() =>
        messageSchema.parse({
          content: "Hello",
          recipientId: "not-a-uuid",
        }),
      ).toThrow(ZodError);
    });

    test("should accept valid message", () => {
      expect(() =>
        messageSchema.parse({
          content: "Hello, this is a test message",
          recipientId: "123e4567-e89b-12d3-a456-426614174000",
        }),
      ).not.toThrow();
    });
  });

  describe("Nested Object Validation", () => {
    const nestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
        profile: z.object({
          displayName: z.string().min(2).max(50),
          bio: z.string().max(500).optional(),
        }),
      }),
    });

    test("should validate nested email field", () => {
      expect(() =>
        nestedSchema.parse({
          user: {
            email: "invalid-email",
            profile: {
              displayName: "Test User",
            },
          },
        }),
      ).toThrow(ZodError);
    });

    test("should validate nested profile field", () => {
      expect(() =>
        nestedSchema.parse({
          user: {
            email: "test@example.com",
            profile: {
              displayName: "A",
            },
          },
        }),
      ).toThrow(ZodError);
    });

    test("should handle nested validation errors", () => {
      const zodError = createZodError([
        { path: ["user", "email"], message: "Invalid email" },
        { path: ["user", "profile", "displayName"], message: "Too short" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors).toHaveLength(2);
      expect(error.error.details.validationErrors[0].field).toBe("user.email");
      expect(error.error.details.validationErrors[1].field).toBe(
        "user.profile.displayName",
      );
    });
  });

  describe("Array Validation", () => {
    const arraySchema = z.object({
      tags: z.array(z.string().min(1).max(20)).min(1).max(10),
    });

    test("should reject empty array", () => {
      expect(() => arraySchema.parse({ tags: [] })).toThrow(ZodError);
    });

    test("should reject array with too many items", () => {
      const tooManyTags = Array(11).fill("tag");
      expect(() => arraySchema.parse({ tags: tooManyTags })).toThrow(ZodError);
    });

    test("should reject invalid array item", () => {
      expect(() =>
        arraySchema.parse({
          tags: ["valid", "", "also-valid"],
        }),
      ).toThrow(ZodError);
    });

    test("should accept valid array", () => {
      expect(() =>
        arraySchema.parse({
          tags: ["tag1", "tag2", "tag3"],
        }),
      ).not.toThrow();
    });
  });

  describe("Missing Required Fields", () => {
    const requiredFieldsSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number(),
    });

    test("should reject missing required field", () => {
      expect(() =>
        requiredFieldsSchema.parse({
          name: "Test",
          email: "test@example.com",
          // age is missing
        }),
      ).toThrow(ZodError);
    });

    test("should handle multiple missing fields error", () => {
      const zodError = createZodError([
        { path: ["name"], message: "Required" },
        { path: ["email"], message: "Required" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors).toHaveLength(2);
    });
  });

  describe("Custom Validation Rules", () => {
    const customSchema = z
      .object({
        username: z.string(),
        confirmPassword: z.string(),
      })
      .refine((data) => data.username !== data.confirmPassword, {
        message: "Password cannot be the same as username",
        path: ["confirmPassword"],
      });

    test("should enforce custom validation rule", () => {
      expect(() =>
        customSchema.parse({
          username: "testuser",
          confirmPassword: "testuser",
        }),
      ).toThrow(ZodError);
    });

    test("should pass custom validation when valid", () => {
      expect(() =>
        customSchema.parse({
          username: "testuser",
          confirmPassword: "differentpassword",
        }),
      ).not.toThrow();
    });
  });

  describe("Error Response Format Consistency", () => {
    test("should provide consistent error format for validation errors", () => {
      const zodError = createZodError([
        { path: ["field1"], message: "Error 1" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");

      // Verify consistent format
      expect(error.success).toBe(false);
      expect(error.error.code).toBe("VALIDATION_ERROR");
      expect(error.error.message).toBe("Invalid input data");
      expect(error.error.statusCode).toBe(400);
      expect(error.error.requestId).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
      expect(error.error.details).toBeDefined();
      expect(error.error.details.validationErrors).toBeInstanceOf(Array);
    });

    test("should include field path, message, and code in validation errors", () => {
      const zodError = createZodError([
        { path: ["email"], message: "Invalid email format" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      const validationError = error.error.details.validationErrors[0];

      expect(validationError).toHaveProperty("field");
      expect(validationError).toHaveProperty("message");
      expect(validationError).toHaveProperty("code");
    });
  });
});
