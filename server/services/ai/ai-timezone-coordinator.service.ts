/**
 * AI Timezone Coordinator Service
 * Handles advanced time zone coordination with global scheduling
 */

import { logger } from "../../logger";
import type { ScheduleData, TimeZoneCoordination } from "./ai-algorithm-types";

export class AITimezoneCoordinatorService {
  private static instance: AITimezoneCoordinatorService;

  private readonly TIMEZONE_FACTORS = {
    offsetCompatibility: 0.35,
    scheduleOverlap: 0.3,
    flexibility: 0.2,
    globalReach: 0.15,
  };

  private constructor() {
    logger.debug("AI Timezone Coordinator Service initialized");
  }

  public static getInstance(): AITimezoneCoordinatorService {
    if (!AITimezoneCoordinatorService.instance) {
      AITimezoneCoordinatorService.instance =
        new AITimezoneCoordinatorService();
    }
    return AITimezoneCoordinatorService.instance;
  }

  /**
   * Advanced timezone coordination analysis
   */
  async analyzeCoordination(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): Promise<TimeZoneCoordination> {
    try {
      const userTz = userSchedule.timeZone;
      const candidateTz = candidateSchedule.timeZone;

      // Calculate timezone offset compatibility
      const timezoneOffset = this.calculateTimezoneOffset(userTz, candidateTz);
      const offsetCompatibility =
        this.calculateOffsetCompatibility(timezoneOffset);

      // Find optimal overlapping time slots
      const optimalTimeSlots = this.findOptimalTimeSlots(
        userSchedule,
        candidateSchedule,
      );

      // Identify scheduling conflicts
      const conflictAreas = this.identifySchedulingConflicts(
        userSchedule,
        candidateSchedule,
      );

      // Calculate scheduling flexibility
      const schedulingFlexibility = this.calculateSchedulingFlexibility(
        userSchedule,
        candidateSchedule,
      );

      // Calculate global reach potential
      const globalReachPotential = this.calculateGlobalReachPotential(
        userTz,
        candidateTz,
      );

      // Find weekend opportunities
      const weekendOpportunities = this.findWeekendOpportunities(
        userSchedule,
        candidateSchedule,
      );

      // Identify timezone advantages
      const timezoneAdvantages = this.identifyTimezoneAdvantages(
        userTz,
        candidateTz,
      );

      // Calculate overall compatibility score
      const compatibilityScore =
        offsetCompatibility * this.TIMEZONE_FACTORS.offsetCompatibility +
        (optimalTimeSlots.length / 7) * this.TIMEZONE_FACTORS.scheduleOverlap +
        schedulingFlexibility * this.TIMEZONE_FACTORS.flexibility +
        globalReachPotential * this.TIMEZONE_FACTORS.globalReach;

      return {
        compatibilityScore: Math.min(100, compatibilityScore * 100),
        optimalTimeSlots,
        conflictAreas,
        schedulingFlexibility: schedulingFlexibility * 100,
        globalReachPotential: globalReachPotential * 100,
        weekendOpportunities,
        timezoneAdvantages,
      };
    } catch (error) {
      logger.error("Timezone coordination analysis failed", {
        error,
        userTz: userSchedule?.timeZone,
        candidateTz: candidateSchedule?.timeZone,
      });
      return {
        compatibilityScore: 50,
        optimalTimeSlots: [],
        conflictAreas: ["Unable to analyze schedules"],
        schedulingFlexibility: 40,
        globalReachPotential: 50,
        weekendOpportunities: [],
        timezoneAdvantages: [],
      };
    }
  }

  private calculateTimezoneOffset(userTz: string, candidateTz: string): number {
    // Simplified timezone offset calculation
    const timezoneOffsets: Record<string, number> = {
      EST: -5,
      PST: -8,
      CST: -6,
      MST: -7,
      CET: 1,
      GMT: 0,
      JST: 9,
      AEST: 10,
      IST: 5.5,
    };

    const userOffset = timezoneOffsets[userTz] || 0;
    const candidateOffset = timezoneOffsets[candidateTz] || 0;

    return Math.abs(userOffset - candidateOffset);
  }

  private calculateOffsetCompatibility(timezoneOffset: number): number {
    if (timezoneOffset === 0) {
      return 1.0;
    }
    if (timezoneOffset > 12) {
      timezoneOffset = 24 - timezoneOffset;
    }
    if (timezoneOffset > 8) {
      return 0.2;
    }
    return 1 - timezoneOffset / 8;
  }

  private findOptimalTimeSlots(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): string[] {
    const optimalSlots: string[] = [];
    const userSlots = userSchedule.availableTimeSlots || [];
    const candidateSlots = candidateSchedule.availableTimeSlots || [];

    userSlots.forEach((userSlot) => {
      candidateSlots.forEach((candidateSlot) => {
        if (this.isTimeSlotCompatible(userSlot, candidateSlot)) {
          optimalSlots.push(`${userSlot} (overlaps with ${candidateSlot})`);
        }
      });
    });

    return optimalSlots.slice(0, 10);
  }

  private isTimeSlotCompatible(slot1: string, slot2: string): boolean {
    // Simplified time slot compatibility check
    return slot1 === slot2;
  }

  private identifySchedulingConflicts(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): string[] {
    const conflicts: string[] = [];
    const userTz = userSchedule.timeZone;
    const candidateTz = candidateSchedule.timeZone;
    const timezoneOffset = this.calculateTimezoneOffset(userTz, candidateTz);

    if (timezoneOffset > 8) {
      conflicts.push(`Large timezone difference: ${timezoneOffset} hours`);
    }

    if (
      userSchedule.flexibility === "low" &&
      candidateSchedule.flexibility === "low"
    ) {
      conflicts.push("Both streamers have low scheduling flexibility");
    }

    if (
      userSchedule.regularHours.length === 0 ||
      candidateSchedule.regularHours.length === 0
    ) {
      conflicts.push("Missing regular streaming hours data");
    }

    return conflicts;
  }

  private calculateSchedulingFlexibility(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): number {
    const flexibilityMap = { low: 0.3, medium: 0.6, high: 0.9 };
    const userFlex = flexibilityMap[userSchedule.flexibility] || 0.5;
    const candidateFlex = flexibilityMap[candidateSchedule.flexibility] || 0.5;

    // Average flexibility
    const avgFlexibility = (userFlex + candidateFlex) / 2;

    // Bonus if both are flexible
    const flexibilityBonus = userFlex > 0.5 && candidateFlex > 0.5 ? 0.1 : 0;

    return Math.min(1, avgFlexibility + flexibilityBonus);
  }

  private calculateGlobalReachPotential(
    userTz: string,
    candidateTz: string,
  ): number {
    // Different timezones can expand global reach
    const timezoneOffset = this.calculateTimezoneOffset(userTz, candidateTz);

    // Identify major global regions covered
    const regions = new Set<string>();
    if (userTz.includes("EST") || userTz.includes("PST"))
      regions.add("Americas");
    if (userTz.includes("CET") || userTz.includes("GMT")) regions.add("Europe");
    if (userTz.includes("JST") || userTz.includes("AEST")) regions.add("Asia");

    if (candidateTz.includes("EST") || candidateTz.includes("PST"))
      regions.add("Americas");
    if (candidateTz.includes("CET") || candidateTz.includes("GMT"))
      regions.add("Europe");
    if (candidateTz.includes("JST") || candidateTz.includes("AEST"))
      regions.add("Asia");

    // More regions = higher global reach
    const regionScore = regions.size / 3;

    // Different timezones provide time coverage
    const timezoneDiversity =
      timezoneOffset > 0 ? Math.min(0.5, timezoneOffset / 12) : 0;

    return regionScore * 0.7 + timezoneDiversity * 0.3;
  }

  private findWeekendOpportunities(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): string[] {
    const opportunities: string[] = [];
    const weekendDays = ["Saturday", "Sunday"];

    const userWeekendSlots = userSchedule.regularHours.filter((slot) =>
      weekendDays.includes(slot.day),
    );
    const candidateWeekendSlots = candidateSchedule.regularHours.filter(
      (slot) => weekendDays.includes(slot.day),
    );

    if (userWeekendSlots.length > 0 && candidateWeekendSlots.length > 0) {
      opportunities.push("Both streamers available on weekends");
    }

    weekendDays.forEach((day) => {
      const userDay = userWeekendSlots.find((slot) => slot.day === day);
      const candidateDay = candidateWeekendSlots.find(
        (slot) => slot.day === day,
      );
      if (userDay && candidateDay) {
        opportunities.push(`${day} collaboration potential`);
      }
    });

    return opportunities;
  }

  private identifyTimezoneAdvantages(
    userTz: string,
    candidateTz: string,
  ): string[] {
    const advantages: string[] = [];

    if (userTz !== candidateTz) {
      advantages.push("Different timezones expand audience reach");
    }

    if (this.calculateTimezoneOffset(userTz, candidateTz) <= 3) {
      advantages.push("Small timezone difference enables easy coordination");
    }

    // Check for complementary coverage
    const timezoneOffset = this.calculateTimezoneOffset(userTz, candidateTz);
    if (timezoneOffset >= 6 && timezoneOffset <= 12) {
      advantages.push("Timezones provide 12-18 hour global coverage");
    }

    return advantages;
  }
}

export const aiTimezoneCoordinator = AITimezoneCoordinatorService.getInstance();
