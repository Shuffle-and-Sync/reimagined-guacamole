import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";

/**
 * Timezone utility functions for event management
 * Provides conversion, formatting, and overlap detection for timezones
 */
export class TimezoneUtils {
  /**
   * Convert a date from one timezone to another
   * @param date - The date to convert
   * @param fromTz - Source timezone (IANA format)
   * @param toTz - Target timezone (IANA format)
   * @returns Converted date in target timezone
   */
  static convertTimezone(date: Date, fromTz: string, toTz: string): Date {
    try {
      const zonedDate = toZonedTime(date, fromTz);
      return fromZonedTime(zonedDate, toTz);
    } catch (error) {
      throw new Error(
        `Failed to convert timezone from ${fromTz} to ${toTz}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get timezone offset in hours
   * @param timezone - IANA timezone identifier
   * @param date - Date to calculate offset for (defaults to now)
   * @returns Offset in hours
   */
  static getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    try {
      const utcDate = toZonedTime(date, "UTC");
      const tzDate = toZonedTime(date, timezone);
      const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
      return offset;
    } catch (error) {
      throw new Error(
        `Failed to get timezone offset for ${timezone}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Format date in specific timezone
   * @param date - Date to format
   * @param timezone - IANA timezone identifier
   * @param formatString - date-fns format string (defaults to 'PPpp')
   * @returns Formatted date string
   */
  static formatInTimezone(
    date: Date,
    timezone: string,
    formatString: string = "PPpp",
  ): string {
    try {
      return formatTz(toZonedTime(date, timezone), formatString, {
        timeZone: timezone,
      });
    } catch (error) {
      throw new Error(
        `Failed to format date in timezone ${timezone}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check if two time ranges overlap
   * @param start1 - Start of first range
   * @param end1 - End of first range
   * @param start2 - Start of second range
   * @param end2 - End of second range
   * @returns true if ranges overlap
   */
  static doTimeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Get current time in specific timezone
   * @param timezone - IANA timezone identifier
   * @returns Current date/time in specified timezone
   */
  static nowInTimezone(timezone: string): Date {
    try {
      return toZonedTime(new Date(), timezone);
    } catch (error) {
      throw new Error(
        `Failed to get current time in timezone ${timezone}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Parse date string in specific timezone
   * @param dateString - ISO date string
   * @param timezone - IANA timezone identifier
   * @returns Parsed date
   */
  static parseInTimezone(dateString: string, timezone: string): Date {
    try {
      const parsed = new Date(dateString);
      return fromZonedTime(parsed, timezone);
    } catch (error) {
      throw new Error(
        `Failed to parse date in timezone ${timezone}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get timezone abbreviation (e.g., EST, PST)
   * @param timezone - IANA timezone identifier
   * @param date - Date to get abbreviation for (defaults to now)
   * @returns Timezone abbreviation
   */
  static getTimezoneAbbreviation(
    timezone: string,
    date: Date = new Date(),
  ): string {
    try {
      const formatted = formatTz(toZonedTime(date, timezone), "zzz", {
        timeZone: timezone,
      });
      return formatted;
    } catch {
      // Return timezone itself if abbreviation cannot be determined
      return timezone;
    }
  }
}
