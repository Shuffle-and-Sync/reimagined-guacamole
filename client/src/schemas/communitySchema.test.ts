import { describe, it, expect } from "vitest";
import {
  communitySchema,
  PRIVACY_LEVELS,
  POSTING_PERMISSIONS,
  DEFAULT_TOURNAMENT_FORMATS,
} from "./communitySchema";

describe("Community Schema", () => {
  describe("Basic Validation", () => {
    it("should validate a valid community", () => {
      const validCommunity = {
        name: "mtg-players",
        displayName: "MTG Players",
        description: "A community for Magic the Gathering players",
        privacyLevel: "public" as const,
        requireMemberApproval: false,
        postingPermissions: "members" as const,
      };

      const result = communitySchema.safeParse(validCommunity);
      expect(result.success).toBe(true);
    });

    it("should use default values", () => {
      const minimalCommunity = {
        name: "test-community",
      };

      const result = communitySchema.safeParse(minimalCommunity);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.privacyLevel).toBe("public");
        expect(result.data.requireMemberApproval).toBe(false);
        expect(result.data.postingPermissions).toBe("members");
      }
    });
  });

  describe("Name Validation", () => {
    it("should accept valid community name", () => {
      const community = {
        name: "pokemon-tcg",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });

    it("should reject too short name", () => {
      const community = {
        name: "ab",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at least 3");
      }
    });

    it("should reject too long name", () => {
      const community = {
        name: "a".repeat(101),
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 100");
      }
    });
  });

  describe("Display Name Validation", () => {
    it("should accept valid display name", () => {
      const community = {
        name: "test-community",
        displayName: "Test Community",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });

    it("should reject too short display name", () => {
      const community = {
        name: "test-community",
        displayName: "AB",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at least 3");
      }
    });
  });

  describe("Description Validation", () => {
    it("should accept valid description", () => {
      const community = {
        name: "test-community",
        description: "This is a test community for TCG players",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });

    it("should reject too long description", () => {
      const community = {
        name: "test-community",
        description: "A".repeat(1001),
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 1000");
      }
    });

    it("should accept empty description", () => {
      const community = {
        name: "test-community",
        description: "",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });
  });

  describe("Privacy Level Validation", () => {
    it("should accept all valid privacy levels", () => {
      PRIVACY_LEVELS.forEach((level) => {
        const community = {
          name: "test-community",
          privacyLevel: level,
        };

        const result = communitySchema.safeParse(community);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid privacy level", () => {
      const community = {
        name: "test-community",
        privacyLevel: "invalid-level",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
    });
  });

  describe("Posting Permissions Validation", () => {
    it("should accept all valid posting permissions", () => {
      POSTING_PERMISSIONS.forEach((permission) => {
        const community = {
          name: "test-community",
          postingPermissions: permission,
        };

        const result = communitySchema.safeParse(community);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid posting permission", () => {
      const community = {
        name: "test-community",
        postingPermissions: "invalid-permission",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
    });
  });

  describe("Member Approval Validation", () => {
    it("should accept boolean values for member approval", () => {
      const community1 = {
        name: "test-community",
        requireMemberApproval: true,
      };

      const result1 = communitySchema.safeParse(community1);
      expect(result1.success).toBe(true);

      const community2 = {
        name: "test-community",
        requireMemberApproval: false,
      };

      const result2 = communitySchema.safeParse(community2);
      expect(result2.success).toBe(true);
    });
  });

  describe("Tournament Format Validation", () => {
    it("should accept valid tournament formats", () => {
      DEFAULT_TOURNAMENT_FORMATS.forEach((format) => {
        const community = {
          name: "test-community",
          defaultTournamentFormat: format,
        };

        const result = communitySchema.safeParse(community);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid tournament format", () => {
      const community = {
        name: "test-community",
        defaultTournamentFormat: "invalid-format",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
    });
  });

  describe("Rules Validation", () => {
    it("should accept valid rules", () => {
      const community = {
        name: "test-community",
        rules: "1. Be respectful\n2. No spam\n3. Have fun!",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });

    it("should reject too long rules", () => {
      const community = {
        name: "test-community",
        rules: "A".repeat(5001),
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 5000");
      }
    });

    it("should accept empty rules", () => {
      const community = {
        name: "test-community",
        rules: "",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });
  });

  describe("Image URL Validation", () => {
    it("should accept valid image URLs", () => {
      const community = {
        name: "test-community",
        imageUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.jpg",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });

    it("should reject invalid URLs", () => {
      const community = {
        name: "test-community",
        imageUrl: "not-a-url",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Invalid URL");
      }
    });

    it("should accept empty URLs", () => {
      const community = {
        name: "test-community",
        imageUrl: "",
        bannerUrl: "",
      };

      const result = communitySchema.safeParse(community);
      expect(result.success).toBe(true);
    });
  });

  describe("Complete Community", () => {
    it("should validate a complete community with all fields", () => {
      const completeCommunity = {
        name: "magic-players",
        displayName: "Magic: The Gathering Players",
        description: "A community for competitive and casual MTG players",
        privacyLevel: "public" as const,
        requireMemberApproval: true,
        postingPermissions: "members" as const,
        defaultTournamentFormat: "swiss" as const,
        rules: "1. Be respectful\n2. No cheating\n3. Have fun!",
        imageUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.jpg",
      };

      const result = communitySchema.safeParse(completeCommunity);
      expect(result.success).toBe(true);
    });
  });
});
