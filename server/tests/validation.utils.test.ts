/**
 * Tests for validation utilities
 */

import {
  isValidEmail,
  isValidUrl,
  isValidUsername,
  sanitizeEmail,
  sanitizeString,
  isEmpty,
  isValidLength,
  isValidDateString,
  isValidTimeString,
  isValidPhone,
  isValidUuid,
  isValidId,
  isNonEmptyArray,
  isInRange,
  isValidInteger,
  isPositive,
  emailSchema,
  urlSchema,
  usernameSchema,
  idSchema,
  dateStringSchema,
  timeStringSchema,
  paginationSchema,
  sortSchema,
} from "../utils/validation.utils";

describe("validation.utils", () => {
  describe("isValidEmail", () => {
    it("should validate correct email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("first+last@test.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("test @example.com")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      expect(isValidEmail(123 as any)).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should validate correct URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://test.org/path")).toBe(true);
      expect(isValidUrl("https://sub.domain.com:8080/path?query=value")).toBe(
        true,
      );
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("notaurl")).toBe(false);
      // Note: URL constructor accepts ftp:// as valid
    });
  });

  describe("isValidUsername", () => {
    it("should validate correct usernames", () => {
      expect(isValidUsername("user123")).toBe(true);
      expect(isValidUsername("test_user")).toBe(true);
      expect(isValidUsername("user-name")).toBe(true);
    });

    it("should reject invalid usernames", () => {
      expect(isValidUsername("a")).toBe(false); // too short
      expect(isValidUsername("a".repeat(31))).toBe(false); // too long
      expect(isValidUsername("user name")).toBe(false); // contains space
      expect(isValidUsername("user@name")).toBe(false); // invalid character
    });
  });

  describe("sanitizeEmail", () => {
    it("should trim and lowercase email", () => {
      expect(sanitizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
      expect(sanitizeEmail("USER@DOMAIN.ORG")).toBe("user@domain.org");
    });
  });

  describe("sanitizeString", () => {
    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
      expect(sanitizeString("\n\ttest\t\n")).toBe("test");
    });
  });

  describe("isEmpty", () => {
    it("should detect empty values", () => {
      expect(isEmpty("")).toBe(true);
      expect(isEmpty("   ")).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it("should detect non-empty values", () => {
      expect(isEmpty("hello")).toBe(false);
      expect(isEmpty("  a  ")).toBe(false);
    });
  });

  describe("isValidLength", () => {
    it("should validate string length", () => {
      expect(isValidLength("hello", 3, 10)).toBe(true);
      expect(isValidLength("hi", 2, 10)).toBe(true);
      expect(isValidLength("x", 1, 1)).toBe(true);
    });

    it("should reject invalid lengths", () => {
      expect(isValidLength("hi", 3, 10)).toBe(false);
      expect(isValidLength("toolongstring", 1, 5)).toBe(false);
    });
  });

  describe("isValidDateString", () => {
    it("should validate correct date strings", () => {
      expect(isValidDateString("2024-01-15")).toBe(true);
      expect(isValidDateString("2023-12-31")).toBe(true);
    });

    it("should reject invalid date strings", () => {
      expect(isValidDateString("")).toBe(false);
      expect(isValidDateString("2024-13-01")).toBe(false); // invalid month
      expect(isValidDateString("2024-01-32")).toBe(false); // invalid day
      expect(isValidDateString("01-15-2024")).toBe(false); // wrong format
    });
  });

  describe("isValidTimeString", () => {
    it("should validate correct time strings", () => {
      expect(isValidTimeString("12:30")).toBe(true);
      expect(isValidTimeString("00:00")).toBe(true);
      expect(isValidTimeString("23:59")).toBe(true);
    });

    it("should reject invalid time strings", () => {
      expect(isValidTimeString("")).toBe(false);
      expect(isValidTimeString("24:00")).toBe(false);
      expect(isValidTimeString("12:60")).toBe(false);
      expect(isValidTimeString("1:30")).toBe(false); // missing leading zero
    });
  });

  describe("isValidPhone", () => {
    it("should validate phone numbers", () => {
      expect(isValidPhone("1234567890")).toBe(true);
      expect(isValidPhone("(123) 456-7890")).toBe(true);
      expect(isValidPhone("+1-234-567-8900")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhone("")).toBe(false);
      expect(isValidPhone("123")).toBe(false); // too short
      expect(isValidPhone("abc")).toBe(false);
    });
  });

  describe("isValidUuid", () => {
    it("should validate UUIDs", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isValidUuid("")).toBe(false);
      expect(isValidUuid("not-a-uuid")).toBe(false);
      expect(isValidUuid("550e8400-e29b-41d4-a716")).toBe(false); // incomplete
    });
  });

  describe("isValidId", () => {
    it("should validate IDs", () => {
      expect(isValidId("user_123")).toBe(true);
      expect(isValidId("test-id-456")).toBe(true);
      expect(isValidId("abc123XYZ")).toBe(true);
    });

    it("should reject invalid IDs", () => {
      expect(isValidId("")).toBe(false);
      expect(isValidId("id with spaces")).toBe(false);
      expect(isValidId("id@special")).toBe(false);
    });
  });

  describe("isNonEmptyArray", () => {
    it("should validate non-empty arrays", () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray(["test"])).toBe(true);
    });

    it("should reject empty arrays", () => {
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray(null as any)).toBe(false);
    });
  });

  describe("isInRange", () => {
    it("should validate numbers in range", () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it("should reject numbers out of range", () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe("isValidInteger", () => {
    it("should validate integers", () => {
      expect(isValidInteger(0)).toBe(true);
      expect(isValidInteger(-5)).toBe(true);
      expect(isValidInteger(100)).toBe(true);
    });

    it("should reject non-integers", () => {
      expect(isValidInteger(3.14)).toBe(false);
      expect(isValidInteger(NaN)).toBe(false);
      expect(isValidInteger("5" as any)).toBe(false);
    });
  });

  describe("isPositive", () => {
    it("should validate positive numbers", () => {
      expect(isPositive(1)).toBe(true);
      expect(isPositive(0.1)).toBe(true);
      expect(isPositive(100)).toBe(true);
    });

    it("should reject non-positive numbers", () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-1)).toBe(false);
    });
  });

  describe("Zod schemas", () => {
    describe("emailSchema", () => {
      it("should parse valid emails", () => {
        const result = emailSchema.parse("  Test@Example.COM  ");
        expect(result).toBe("test@example.com");
      });

      it("should reject invalid emails", () => {
        expect(() => emailSchema.parse("notanemail")).toThrow();
        expect(() => emailSchema.parse("")).toThrow();
      });
    });

    describe("urlSchema", () => {
      it("should parse valid URLs", () => {
        expect(urlSchema.parse("https://example.com")).toBe(
          "https://example.com",
        );
        expect(urlSchema.parse("")).toBe("");
      });

      it("should reject invalid URLs", () => {
        expect(() => urlSchema.parse("notaurl")).toThrow();
      });
    });

    describe("usernameSchema", () => {
      it("should parse valid usernames", () => {
        expect(usernameSchema.parse("user123")).toBe("user123");
      });

      it("should reject invalid usernames", () => {
        expect(() => usernameSchema.parse("a")).toThrow();
        expect(() => usernameSchema.parse("user name")).toThrow();
      });
    });

    describe("idSchema", () => {
      it("should parse valid IDs", () => {
        expect(idSchema.parse("user_123")).toBe("user_123");
      });

      it("should reject invalid IDs", () => {
        expect(() => idSchema.parse("")).toThrow();
        expect(() => idSchema.parse("id with spaces")).toThrow();
      });
    });

    describe("dateStringSchema", () => {
      it("should parse valid date strings", () => {
        expect(dateStringSchema.parse("2024-01-15")).toBe("2024-01-15");
      });

      it("should reject invalid date strings", () => {
        expect(() => dateStringSchema.parse("01-15-2024")).toThrow();
      });
    });

    describe("timeStringSchema", () => {
      it("should parse valid time strings", () => {
        expect(timeStringSchema.parse("12:30")).toBe("12:30");
      });

      it("should reject invalid time strings", () => {
        expect(() => timeStringSchema.parse("24:00")).toThrow();
      });
    });

    describe("paginationSchema", () => {
      it("should parse pagination params with defaults", () => {
        const result = paginationSchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(50);
      });

      it("should parse custom pagination params", () => {
        const result = paginationSchema.parse({ page: 2, limit: 25 });
        expect(result.page).toBe(2);
        expect(result.limit).toBe(25);
      });

      it("should reject invalid pagination params", () => {
        expect(() => paginationSchema.parse({ page: 0 })).toThrow();
        expect(() => paginationSchema.parse({ limit: 200 })).toThrow();
      });
    });

    describe("sortSchema", () => {
      it("should parse sort params with defaults", () => {
        const result = sortSchema.parse({ field: "createdAt" });
        expect(result.field).toBe("createdAt");
        expect(result.direction).toBe("asc");
      });

      it("should parse custom sort params", () => {
        const result = sortSchema.parse({ field: "name", direction: "desc" });
        expect(result.direction).toBe("desc");
      });
    });
  });
});
