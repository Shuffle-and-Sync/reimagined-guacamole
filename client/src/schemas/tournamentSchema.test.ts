import { describe, it, expect } from "vitest";
import {
  tournamentSchema,
  tournamentEditSchema,
  TOURNAMENT_FORMATS,
} from "./tournamentSchema";

describe("Tournament Schema", () => {
  describe("Basic Validation", () => {
    it("should validate a valid tournament", () => {
      const validTournament = {
        name: "Summer Championship",
        description: "Annual summer tournament",
        gameFormat: "commander",
        maxParticipants: 16,
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: "Main Hall",
      };

      const result = tournamentSchema.safeParse(validTournament);
      expect(result.success).toBe(true);
    });

    it("should reject tournament with short name", () => {
      const invalidTournament = {
        name: "AB",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at least 3");
      }
    });

    it("should reject tournament with too few participants", () => {
      const invalidTournament = {
        name: "Test Tournament",
        gameFormat: "commander",
        maxParticipants: 1,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at least 2");
      }
    });

    it("should reject tournament with too many participants", () => {
      const invalidTournament = {
        name: "Test Tournament",
        gameFormat: "commander",
        maxParticipants: 200,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Cannot exceed 128");
      }
    });
  });

  describe("Date Validation", () => {
    it("should reject tournament with past start date", () => {
      const invalidTournament = {
        name: "Test Tournament",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "must be in the future",
        );
      }
    });

    it("should reject tournament where end date is before start date", () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const today = new Date();

      const invalidTournament = {
        name: "Test Tournament",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: tomorrow.toISOString(),
        endDate: today.toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "End date must be after start date",
        );
      }
    });
  });

  describe("Swiss Format Validation", () => {
    it("should accept even number of participants for swiss format", () => {
      const validTournament = {
        name: "Swiss Tournament",
        gameFormat: "commander",
        format: "swiss" as const,
        maxParticipants: 16,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(validTournament);
      expect(result.success).toBe(true);
    });

    it("should reject odd number of participants for swiss format", () => {
      const invalidTournament = {
        name: "Swiss Tournament",
        gameFormat: "commander",
        format: "swiss" as const,
        maxParticipants: 15,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("even number");
      }
    });
  });

  describe("Optional Fields", () => {
    it("should accept tournament without optional fields", () => {
      const minimalTournament = {
        name: "Minimal Tournament",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(minimalTournament);
      expect(result.success).toBe(true);
    });

    it("should accept empty strings for optional fields", () => {
      const tournament = {
        name: "Test Tournament",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        description: "",
        endDate: "",
        location: "",
        prizePool: "",
        rules: "",
      };

      const result = tournamentSchema.safeParse(tournament);
      expect(result.success).toBe(true);
    });
  });

  describe("Field Length Validation", () => {
    it("should reject tournament with too long name", () => {
      const invalidTournament = {
        name: "A".repeat(101),
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 100");
      }
    });

    it("should reject tournament with too long description", () => {
      const invalidTournament = {
        name: "Test Tournament",
        description: "A".repeat(1001),
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 1000");
      }
    });

    it("should reject tournament with too long rules", () => {
      const invalidTournament = {
        name: "Test Tournament",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        rules: "A".repeat(5001),
      };

      const result = tournamentSchema.safeParse(invalidTournament);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("at most 5000");
      }
    });
  });

  describe("Tournament Edit Schema", () => {
    it("should validate complete tournament data", () => {
      const update = {
        name: "Updated Tournament Name",
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentEditSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate provided fields", () => {
      const invalidUpdate = {
        name: "AB", // Too short
        gameFormat: "commander",
        maxParticipants: 8,
        startDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = tournamentEditSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });
});
