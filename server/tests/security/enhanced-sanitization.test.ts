/**
 * Enhanced Input Sanitization Tests
 *
 * Tests for enhanced SQL injection prevention and additional security patterns
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

describe("Enhanced Input Sanitization Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Enhanced SQL Injection Protection", () => {
    test("should detect and sanitize advanced SQL injection patterns", () => {
      const advancedPatterns = [
        // Complex UNION attacks
        "' UNION SELECT password FROM users WHERE id=1 --",
        "' UNION ALL SELECT creditcard FROM payments --",

        // INSERT injections
        "'; INSERT INTO admin_users VALUES ('hacker', 'password123'); --",

        // JOIN-based attacks
        "' JOIN users ON orders.user_id = users.id WHERE users.role='admin' --",

        // Hex-based attacks
        "0x41424344 EXEC sp_adduser",
        "0x73656c656374",

        // Database function abuse
        "'; SELECT CHAR(65,66,67,68) --",
        "'; EXEC CONVERT(varchar, password) FROM users --",
        "'; SELECT ASCII(SUBSTRING(password,1,1)) FROM users --",

        // Information schema attacks
        "'; SELECT table_name FROM information_schema.tables --",
        "'; SELECT column_name FROM information_schema.columns --",

        // System table attacks
        "'; SELECT * FROM sys.tables --",
        "'; SELECT * FROM mysql.user --",
        "'; SELECT * FROM pg_catalog.pg_tables --",
      ];

      advancedPatterns.forEach((pattern, index) => {
        const sanitized = sanitizeDatabaseInput(pattern);

        // Should not contain special chars that enable injection
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain('"');
        expect(sanitized).not.toContain(";");
        expect(sanitized).not.toContain("--");

        // Should not contain the most dangerous keyword combinations
        // Note: Individual keywords might remain if not in dangerous context
        expect(sanitized.toLowerCase()).not.toMatch(/union\s+(all\s+)?select/);
        expect(sanitized.toLowerCase()).not.toMatch(/insert\s+into/);
        expect(sanitized.toLowerCase()).not.toMatch(/drop\s+table/);
        expect(sanitized.toLowerCase()).not.toMatch(/exec\s+sp_/);
        expect(sanitized.toLowerCase()).not.toMatch(/information_schema/);

        console.log(`Test ${index + 1}: "${pattern}" -> "${sanitized}"`);
      });
    });

    test("should log multiple detected patterns with enhanced context", () => {
      const complexInput =
        "'; DROP TABLE users; SELECT * FROM information_schema.tables; EXEC sp_adduser --";

      sanitizeDatabaseInput(complexInput);

      // Should log warning with enhanced context
      expect(logger.warn).toHaveBeenCalledWith(
        "Potential SQL injection attempt detected and sanitized",
        expect.objectContaining({
          input: expect.any(String),
          detectedPatterns: expect.arrayContaining([expect.any(String)]),
          timestamp: expect.any(String),
        }),
      );
    });

    test("should handle nested objects with complex attacks", () => {
      const nestedAttack = {
        username: "admin'; DROP TABLE users; --",
        search: {
          query: "' UNION SELECT password FROM admin_users --",
          filters: {
            category: "'; SELECT * FROM information_schema.tables --",
          },
        },
        metadata: ["0x41424344", "CONVERT(varchar, sensitive_data)"],
      };

      const sanitized = sanitizeDatabaseInput(nestedAttack);

      // Check all levels are sanitized
      expect(sanitized.username).not.toContain("DROP");
      expect(sanitized.search.query).not.toContain("UNION");
      expect(sanitized.search.filters.category).not.toContain(
        "information_schema",
      );
      expect(sanitized.metadata[0]).not.toMatch(/0x[0-9a-f]/i);
      expect(sanitized.metadata[1]).not.toContain("CONVERT");
    });

    test("should enhance XSS protection with additional vectors", () => {
      const xssVectors = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        'vbscript:msgbox("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        '<div onload="alert(1)">content</div>',
        '<span onerror="alert(1)">content</span>',
      ];

      xssVectors.forEach((vector) => {
        const sanitized = sanitizeDatabaseInput(vector);

        // Should remove all XSS vectors
        expect(sanitized).not.toContain("<script");
        expect(sanitized).not.toContain("<img");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("vbscript:");
        expect(sanitized).not.toContain("data:");
        expect(sanitized).not.toContain("onload=");
        expect(sanitized).not.toContain("onerror=");
        expect(sanitized).not.toContain("<");
        expect(sanitized).not.toContain(">");
      });
    });

    test("should preserve legitimate data while removing threats", () => {
      const legitimateInputs = [
        "user@example.com",
        "Valid product description with numbers 123",
        'Search query: "magic the gathering"',
        "User comment about their favorite card",
        "Tournament name: Commander Night 2024",
      ];

      legitimateInputs.forEach((input) => {
        const sanitized = sanitizeDatabaseInput(input);

        // Should preserve the essence of legitimate data
        expect(sanitized.length).toBeGreaterThan(0);
        expect(sanitized).not.toBe("[REDACTED - POTENTIAL CREDENTIAL]");

        // Should still trim and clean
        expect(sanitized).toBe(sanitized.trim());
      });
    });

    test("should handle edge cases and malformed inputs", () => {
      const edgeCases = [
        "", // empty string
        null,
        undefined,
        123, // number
        true, // boolean
        [], // empty array
        {}, // empty object
        "a".repeat(1000), // very long string
        "Mixed\x00Control\x08Characters\x1F",
        "  \t\n  whitespace only  \t\n  ",
      ];

      edgeCases.forEach((input) => {
        expect(() => {
          const result = sanitizeDatabaseInput(input);

          if (typeof input === "string" && input.length > 0) {
            expect(typeof result).toBe("string");
            // eslint-disable-next-line no-control-regex
            expect(result).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/); // No control chars (escaped)
          } else if (input === null || input === undefined) {
            expect(result).toBe(input);
          } else if (typeof input === "number" || typeof input === "boolean") {
            expect(result).toBe(input);
          }
        }).not.toThrow();
      });
    });
  });

  describe("Performance and Security Balance", () => {
    test("should maintain reasonable performance with complex inputs", () => {
      const complexInput = `
        This is a complex input with multiple potential issues:
        '; DROP TABLE users; -- 
        <script>alert('xss')</script>
        javascript:alert('more xss')
        0x41424344 
        SELECT * FROM information_schema.tables
        UNION ALL SELECT password FROM admin_users
        <img onerror="alert(1)" src="x">
        vbscript:msgbox("test")
      `.repeat(10); // Make it even more complex

      const startTime = Date.now();
      const result = sanitizeDatabaseInput(complexInput);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 100ms for this test)
      expect(endTime - startTime).toBeLessThan(100);

      // Should still be thoroughly sanitized
      expect(result).not.toContain("DROP");
      expect(result).not.toContain("<script");
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain("0x");
      expect(result).not.toContain("information_schema");
    });
  });
});
