/**
 * Tests for formatting utilities
 */

import {
  formatDate,
  formatDateHuman,
  formatDateLong,
  formatTime,
  formatTime12Hour,
  formatDateTimeISO,
  formatDateTimeHuman,
  formatRelativeTime,
  formatDuration,
  capitalize,
  capitalizeWords,
  toTitleCase,
  toKebabCase,
  toSnakeCase,
  toCamelCase,
  toPascalCase,
  truncate,
  truncateWords,
  formatNumber,
  formatPercentage,
  formatCurrency,
  formatFileSize,
  formatPhoneUS,
  formatSocialHandle,
  formatUrlDisplay,
  pluralize,
  formatCount,
  formatList,
  stripHtml,
  escapeHtml,
  getInitials,
} from "../utils/formatting.utils";

describe("formatting.utils", () => {
  describe("Date formatting", () => {
    const testDate = new Date("2024-01-15T14:30:00Z");

    it("should format date as YYYY-MM-DD", () => {
      expect(formatDate(testDate)).toBe("2024-01-15");
    });

    it("should format date to human-readable string", () => {
      const result = formatDateHuman(testDate);
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });

    it("should format date to long format", () => {
      const result = formatDateLong(testDate);
      expect(result).toContain("January");
    });

    describe("UTC timezone (default)", () => {
      it("should format time as HH:MM", () => {
        expect(formatTime(testDate)).toBe("14:30");
        expect(formatTime(testDate, { timezone: "UTC" })).toBe("14:30");
      });

      it("should format time to 12-hour format", () => {
        const result = formatTime12Hour(testDate);
        expect(result).toContain("PM");
        expect(result).toContain("2:30");
      });

      it("should format time to 12-hour format with explicit UTC", () => {
        const result = formatTime12Hour(testDate, { timezone: "UTC" });
        expect(result).toContain("PM");
        expect(result).toContain("2:30");
      });
    });

    describe("CST timezone (America/Chicago)", () => {
      it("should format time as HH:MM", () => {
        // 14:30 UTC = 08:30 CST (UTC-6)
        expect(formatTime(testDate, { timezone: "America/Chicago" })).toBe(
          "08:30",
        );
      });

      it("should format time to 12-hour format", () => {
        const result = formatTime12Hour(testDate, {
          timezone: "America/Chicago",
        });
        expect(result).toContain("AM");
        expect(result).toContain("8:30");
      });
    });

    describe("PST timezone (America/Los_Angeles)", () => {
      it("should format time as HH:MM", () => {
        // 14:30 UTC = 06:30 PST (UTC-8)
        expect(formatTime(testDate, { timezone: "America/Los_Angeles" })).toBe(
          "06:30",
        );
      });

      it("should format time to 12-hour format", () => {
        const result = formatTime12Hour(testDate, {
          timezone: "America/Los_Angeles",
        });
        expect(result).toContain("AM");
        expect(result).toContain("6:30");
      });
    });

    it("should format datetime to ISO string", () => {
      const result = formatDateTimeISO(testDate);
      expect(result).toContain("2024-01-15");
      expect(result).toContain("T");
    });

    it("should handle invalid dates", () => {
      expect(formatDate("invalid")).toBe("");
      expect(formatTime("invalid")).toBe("");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format past times", () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
      const result = formatRelativeTime(pastDate);
      expect(result).toContain("5");
      expect(result).toContain("minute");
      expect(result).toContain("ago");
    });

    it("should format future times", () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours from now
      const result = formatRelativeTime(futureDate);
      expect(result).toContain("2");
      expect(result).toContain("hour");
    });

    it("should format recent times as 'just now'", () => {
      const recentDate = new Date(Date.now() - 1000 * 30); // 30 seconds ago
      expect(formatRelativeTime(recentDate)).toBe("just now");
    });
  });

  describe("formatDuration", () => {
    it("should format milliseconds", () => {
      expect(formatDuration(500)).toBe("500ms");
    });

    it("should format seconds", () => {
      expect(formatDuration(5000)).toBe("5s");
    });

    it("should format minutes", () => {
      expect(formatDuration(60000 * 5)).toBe("5m 0s");
    });

    it("should format hours", () => {
      expect(formatDuration(3600000 * 2)).toBe("2h 0m");
    });

    it("should format days", () => {
      expect(formatDuration(86400000 * 3)).toBe("3d 0h");
    });
  });

  describe("String case conversions", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("World");
    });

    it("should capitalize each word", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");
    });

    it("should convert to title case", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
    });

    it("should convert to kebab-case", () => {
      expect(toKebabCase("helloWorld")).toBe("hello-world");
      expect(toKebabCase("Hello World")).toBe("hello-world");
    });

    it("should convert to snake_case", () => {
      expect(toSnakeCase("helloWorld")).toBe("hello_world");
      expect(toSnakeCase("Hello World")).toBe("hello_world");
    });

    it("should convert to camelCase", () => {
      expect(toCamelCase("hello-world")).toBe("helloWorld");
      expect(toCamelCase("hello_world")).toBe("helloWorld");
    });

    it("should convert to PascalCase", () => {
      expect(toPascalCase("hello-world")).toBe("HelloWorld");
      expect(toPascalCase("hello_world")).toBe("HelloWorld");
    });
  });

  describe("String truncation", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
      expect(truncate("Short", 10)).toBe("Short");
    });

    it("should truncate by words", () => {
      expect(truncateWords("Hello World Test", 2)).toBe("Hello World...");
      expect(truncateWords("Short", 5)).toBe("Short");
    });

    it("should use custom suffix", () => {
      expect(truncate("Hello World", 8, "—")).toBe("Hello W—");
    });
  });

  describe("Number formatting", () => {
    it("should format numbers with thousand separators", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("should format numbers with decimals", () => {
      expect(formatNumber(1234.5678, 2)).toBe("1,234.57");
    });

    it("should format percentages", () => {
      expect(formatPercentage(0.5)).toBe("50%");
      expect(formatPercentage(0.1234, 1)).toBe("12.3%");
    });

    it("should format currency", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
      expect(result).toContain("$");
    });

    it("should format file sizes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1073741824)).toBe("1 GB");
    });
  });

  describe("formatPhoneUS", () => {
    it("should format 10-digit phone numbers", () => {
      expect(formatPhoneUS("1234567890")).toBe("(123) 456-7890");
    });

    it("should format 11-digit phone numbers", () => {
      expect(formatPhoneUS("11234567890")).toBe("+1 (123) 456-7890");
    });

    it("should handle already formatted numbers", () => {
      expect(formatPhoneUS("(123) 456-7890")).toBe("(123) 456-7890");
    });
  });

  describe("formatSocialHandle", () => {
    it("should remove @ symbol", () => {
      expect(formatSocialHandle("@username")).toBe("username");
    });

    it("should add @ symbol when requested", () => {
      expect(formatSocialHandle("username", true)).toBe("@username");
      expect(formatSocialHandle("@username", true)).toBe("@username");
    });
  });

  describe("formatUrlDisplay", () => {
    it("should remove protocol and www", () => {
      expect(formatUrlDisplay("https://www.example.com")).toBe("example.com");
      expect(formatUrlDisplay("http://test.org/")).toBe("test.org");
    });

    it("should remove trailing slash", () => {
      expect(formatUrlDisplay("https://example.com/")).toBe("example.com");
    });
  });

  describe("pluralize", () => {
    it("should return singular for count of 1", () => {
      expect(pluralize(1, "item")).toBe("item");
    });

    it("should return plural for other counts", () => {
      expect(pluralize(0, "item")).toBe("items");
      expect(pluralize(2, "item")).toBe("items");
    });

    it("should use custom plural form", () => {
      expect(pluralize(2, "person", "people")).toBe("people");
    });
  });

  describe("formatCount", () => {
    it("should format count with word", () => {
      expect(formatCount(1, "item")).toBe("1 item");
      expect(formatCount(5, "item")).toBe("5 items");
    });
  });

  describe("formatList", () => {
    it("should format list with 'and'", () => {
      expect(formatList(["apple", "banana", "cherry"])).toBe(
        "apple, banana, and cherry",
      );
    });

    it("should handle two items", () => {
      expect(formatList(["apple", "banana"])).toBe("apple and banana");
    });

    it("should handle single item", () => {
      expect(formatList(["apple"])).toBe("apple");
    });

    it("should handle empty array", () => {
      expect(formatList([])).toBe("");
    });

    it("should use custom conjunction", () => {
      expect(formatList(["a", "b"], "or")).toBe("a or b");
    });
  });

  describe("HTML utilities", () => {
    it("should strip HTML tags", () => {
      expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
      expect(stripHtml("Plain text")).toBe("Plain text");
    });

    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
      );
      expect(escapeHtml("Hello \"World\" & 'Friends'")).toContain("&amp;");
    });
  });

  describe("getInitials", () => {
    it("should get initials from name", () => {
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("Mary Jane Watson")).toBe("MJ");
    });

    it("should respect maxLength", () => {
      expect(getInitials("John Paul George Ringo", 3)).toBe("JPG");
    });

    it("should handle single name", () => {
      expect(getInitials("Madonna")).toBe("M");
    });

    it("should handle empty string", () => {
      expect(getInitials("")).toBe("");
    });
  });
});
