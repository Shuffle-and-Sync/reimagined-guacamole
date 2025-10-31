import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";

/**
 * Timezone utility functions for event management
 * Provides conversion, formatting, and overlap detection for timezones
 */
export class TimezoneUtils {
  /**
   * Convert a date's display to a different timezone
   * This maintains the same moment in time but returns it formatted in the target timezone
   * @param date - The date to convert
   * @param fromTz - Source timezone (IANA format) - not used but kept for API compatibility
   * @param toTz - Target timezone (IANA format)
   * @returns Date object representing the same moment in time
   * @note The returned Date is still in UTC internally; use formatInTimezone to display it
   */
  static convertTimezone(date: Date, _fromTz: string, _toTz: string): Date {
    // Simply return the date - it already represents the correct moment in time
    // The timezone is just metadata for display purposes
    // Use formatInTimezone() to display this date in the target timezone
    return date;
  }

  /**
   * Get timezone offset in hours
   * @param timezone - IANA timezone identifier
   * @param date - Date to calculate offset for (defaults to now)
   * @returns Offset in hours
   */
  static getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    try {
      // Get the UTC time parts
      const utcYear = date.getUTCFullYear();
      const utcMonth = date.getUTCMonth();
      const utcDay = date.getUTCDate();
      const utcHour = date.getUTCHours();
      const utcMinute = date.getUTCMinutes();
      const utcSecond = date.getUTCSeconds();

      // Format the date in the target timezone and extract the local time parts
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = dtf.formatToParts(date);
      const getPart = (type: string) => {
        const part = parts.find((p) => p.type === type);
        return part ? parseInt(part.value, 10) : 0;
      };
      const tzYear = getPart("year");
      const tzMonth = getPart("month") - 1; // JS months are 0-based
      const tzDay = getPart("day");
      const tzHour = getPart("hour");
      const tzMinute = getPart("minute");
      const tzSecond = getPart("second");

      // Construct a Date object in the target timezone's local time, but as if it were UTC
      const localAsUTC = Date.UTC(
        tzYear,
        tzMonth,
        tzDay,
        tzHour,
        tzMinute,
        tzSecond,
      );
      const utcTime = Date.UTC(
        utcYear,
        utcMonth,
        utcDay,
        utcHour,
        utcMinute,
        utcSecond,
      );

      // Offset in hours: (local time in target tz - UTC time) / 3600000
      const offset = (localAsUTC - utcTime) / (1000 * 60 * 60);
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
