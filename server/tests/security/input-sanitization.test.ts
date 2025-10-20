/**
 * Input Sanitization Tests
 *
 * Tests for SQL injection prevention and input validation
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { sanitizeDatabaseInput } from "../../utils/database.utils";
import { logger } from "../../logger";

// Mock logger to test warning calls
jest.mock("../../logger", () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Input Sanitization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("sanitizeDatabaseInput", () => {
    test("should sanitize basic SQL injection attempts", () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR 1=1 --",
        "'; INSERT INTO users VALUES ('hacker', 'pass'); --",
        "' UNION SELECT * FROM passwords --",
        "'; DELETE FROM events; --",
      ];

      maliciousInputs.forEach((input) => {
        const sanitized = sanitizeDatabaseInput(input);
        expect(sanitized).not.toContain("DROP");
        expect(sanitized).not.toContain("INSERT");
        expect(sanitized).not.toContain("DELETE");
        expect(sanitized).not.toContain("UNION");
        expect(sanitized).not.toContain("--");
        expect(sanitized).not.toContain(";");
        expect(sanitized).not.toContain("'");
      });
    });

    test("should detect and log SQL injection attempts", () => {
      const maliciousInput = "'; DROP TABLE users; --";
      sanitizeDatabaseInput(maliciousInput);

      expect(logger.warn).toHaveBeenCalledWith(
        "Potential SQL injection attempt detected and sanitized",
        expect.objectContaining({
          input: expect.any(String),
          detectedPatterns: expect.any(Array),
          timestamp: expect.any(String),
        }),
      );
    });

    test("should sanitize XSS attempts", () => {
      const xssInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
      ];

      xssInputs.forEach((input) => {
        const sanitized = sanitizeDatabaseInput(input);
        expect(sanitized).not.toContain("<script");
        expect(sanitized).not.toContain("<img");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("data:");
        expect(sanitized).not.toContain("<");
        expect(sanitized).not.toContain(">");
      });
    });

    test("should handle nested objects", () => {
      const input = {
        name: "'; DROP TABLE users; --",
        email: '<script>alert("XSS")</script>',
        nested: {
          field: "' OR 1=1 --",
        },
      };

      const sanitized = sanitizeDatabaseInput(input);

      expect(sanitized.name).not.toContain("DROP");
      expect(sanitized.email).not.toContain("<script");
      expect(sanitized.nested.field).not.toContain("' OR 1=1");
    });

    test("should handle arrays", () => {
      const input = [
        "'; DROP TABLE users; --",
        '<script>alert("XSS")</script>',
        "normal text",
      ];

      const sanitized = sanitizeDatabaseInput(input);

      expect(sanitized[0]).not.toContain("DROP");
      expect(sanitized[1]).not.toContain("<script");
      expect(sanitized[2]).toBe("normal text");
    });

    test("should preserve clean input", () => {
      const cleanInputs = [
        "normal text",
        "user@example.com",
        "Some description with numbers 123",
        "Valid user input with punctuation!",
      ];

      cleanInputs.forEach((input) => {
        const sanitized = sanitizeDatabaseInput(input);
        expect(sanitized).toBe(input);
      });
    });

    test("should remove control characters", () => {
      const inputWithControlChars = "text\x00with\x08control\x1Fchars";
      const sanitized = sanitizeDatabaseInput(inputWithControlChars);
      expect(sanitized).toBe("textwithcontrolchars");
    });

    test("should handle non-string inputs", () => {
      expect(sanitizeDatabaseInput(123)).toBe(123);
      expect(sanitizeDatabaseInput(true)).toBe(true);
      expect(sanitizeDatabaseInput(null)).toBe(null);
      expect(sanitizeDatabaseInput(undefined)).toBe(undefined);
    });

    test("should trim whitespace", () => {
      const input = "  spaced text  ";
      const sanitized = sanitizeDatabaseInput(input);
      expect(sanitized).toBe("spaced text");
    });
  });

  describe("SQL Injection Pattern Detection", () => {
    test("should detect various SQL injection patterns", () => {
      const patterns = [
        // SQL keywords
        "SELECT * FROM users",
        "INSERT INTO table",
        "UPDATE users SET",
        "DELETE FROM events",
        "DROP TABLE users",
        "ALTER TABLE add",
        "CREATE TABLE test",
        "EXEC sp_adduser",
        "EXECUTE xp_cmdshell",

        // Comment patterns
        "-- comment",
        "/* comment */",

        // Boolean injections
        "' OR 1=1 --",
        "' AND 1=1 --",
        "WHERE id=1 OR 1=1",
        "HAVING count > 0",
      ];

      patterns.forEach((pattern) => {
        const sanitized = sanitizeDatabaseInput(pattern);
        // Should be sanitized (content removed or modified)
        expect(sanitized.toLowerCase()).not.toBe(pattern.toLowerCase());
      });
    });
  });
});
