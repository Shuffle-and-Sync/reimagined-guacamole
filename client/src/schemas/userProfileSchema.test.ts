import { describe, it, expect } from "vitest";
import { userProfileSchema } from "./userProfileSchema";

describe("User Profile Schema", () => {
  describe("Basic Validation", () => {
    it("should validate a valid profile", () => {
      const validProfile = {
        firstName: "John",
        lastName: "Doe",
        displayName: "JohnD",
        bio: "Passionate TCG player",
        email: "john@example.com",
        location: "New York",
        preferredFormat: "commander",
        primaryCommunity: "community-123",
      };

      const result = userProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it("should accept minimal profile", () => {
      const minimalProfile = {
        firstName: "",
        lastName: "",
      };

      const result = userProfileSchema.safeParse(minimalProfile);
      expect(result.success).toBe(true);
    });
  });

  describe("Name Validation", () => {
    it("should accept valid first and last names", () => {
      const profile = {
        firstName: "Jane",
        lastName: "Smith",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should reject too long first name", () => {
      const profile = {
        firstName: "A".repeat(51),
        lastName: "Smith",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 50");
      }
    });

    it("should reject too long last name", () => {
      const profile = {
        firstName: "John",
        lastName: "A".repeat(51),
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 50");
      }
    });
  });

  describe("Display Name Validation", () => {
    it("should accept valid display name", () => {
      const profile = {
        displayName: "Player123",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should reject too short display name", () => {
      const profile = {
        displayName: "AB",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at least 3");
      }
    });

    it("should reject too long display name", () => {
      const profile = {
        displayName: "A".repeat(51),
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 50");
      }
    });
  });

  describe("Bio Validation", () => {
    it("should accept valid bio", () => {
      const profile = {
        bio: "I love playing Magic the Gathering and Pokemon TCG",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should reject too long bio", () => {
      const profile = {
        bio: "A".repeat(501),
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 500");
      }
    });

    it("should accept empty bio", () => {
      const profile = {
        bio: "",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email", () => {
      const profile = {
        email: "user@example.com",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const profile = {
        email: "not-an-email",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Invalid email");
      }
    });

    it("should accept empty email", () => {
      const profile = {
        email: "",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe("Phone Validation", () => {
    it("should accept valid phone numbers", () => {
      const validPhones = [
        "123-456-7890",
        "(123) 456-7890",
        "1234567890",
        "+1234567890",
        "123.456.7890",
      ];

      validPhones.forEach((phone) => {
        const profile = { phone };
        const result = userProfileSchema.safeParse(profile);
        expect(result.success).toBe(true);
      });
    });

    it("should accept empty phone", () => {
      const profile = {
        phone: "",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe("Image URL Validation", () => {
    it("should accept valid image URLs", () => {
      const validUrls = [
        "https://example.com/image.jpg",
        "https://example.com/image.png",
        "https://example.com/image.gif",
        "https://example.com/image.webp",
        "https://example.com/image.svg",
      ];

      validUrls.forEach((url) => {
        const profile = { profileImageUrl: url };
        const result = userProfileSchema.safeParse(profile);
        expect(result.success).toBe(true);
      });
    });

    it("should reject non-image URLs", () => {
      const profile = {
        profileImageUrl: "https://example.com/document.pdf",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("valid image URL");
      }
    });

    it("should accept empty image URL", () => {
      const profile = {
        profileImageUrl: "",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe("Location Validation", () => {
    it("should accept valid location", () => {
      const profile = {
        location: "San Francisco, CA",
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should reject too long location", () => {
      const profile = {
        location: "A".repeat(101),
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 100");
      }
    });
  });

  describe("Notification Preferences", () => {
    it("should accept valid notification preferences", () => {
      const profile = {
        notificationPreferences: {
          email: true,
          push: false,
          tournaments: true,
          messages: false,
        },
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("should accept partial notification preferences", () => {
      const profile = {
        notificationPreferences: {
          email: true,
        },
      };

      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });
});
