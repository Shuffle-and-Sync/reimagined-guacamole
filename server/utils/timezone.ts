/**
 * Timezone Utilities
 *
 * Utilities for timezone validation, conversion, and formatting.
 * Uses the IANA timezone database (e.g., "America/New_York", "Europe/London").
 */

import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/**
 * List of common IANA timezones for validation
 * This is a subset of the most commonly used timezones
 */
const COMMON_TIMEZONES = [
  // Americas
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  // Europe
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Moscow",
  // Asia
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Seoul",
  // Pacific
  "Pacific/Auckland",
  "Pacific/Sydney",
  "Pacific/Melbourne",
  "Pacific/Fiji",
  // Africa
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  // Special
  "UTC",
  "GMT",
];

/**
 * Validates if a timezone string is a valid IANA timezone
 * @param timezone - The timezone string to validate
 * @returns true if valid, false otherwise
 */
export function validateTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== "string") {
    return false;
  }

  // Reject common abbreviations (EST, PST, etc.)
  if (timezone.length <= 4 && timezone.toUpperCase() === timezone) {
    // Allow UTC and GMT
    if (timezone === "UTC" || timezone === "GMT") {
      return true;
    }
    return false;
  }

  // Check if it's in our common list
  if (COMMON_TIMEZONES.includes(timezone)) {
    return true;
  }

  // Try to use Intl.DateTimeFormat to validate any IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Converts a date from one timezone to another
 * Takes a date that represents a local time in the source timezone,
 * and returns a Date object representing the same wall-clock time in the target timezone.
 *
 * Note: This validates both timezones but conversion is done via UTC.
 * The date parameter is assumed to be in UTC, and we convert to the target timezone.
 *
 * @param date - The date to convert (typically in UTC)
 * @param fromTimezone - The source timezone (IANA format) - validated but not used in conversion
 * @param toTimezone - The target timezone (IANA format) - the timezone to convert to
 * @returns The date adjusted to the target timezone
 *
 * @example
 * // Event at 2 PM EST (7 PM UTC)
 * const utcDate = new Date("2024-12-25T19:00:00Z");
 * const pstDate = convertTimezone(utcDate, "America/New_York", "America/Los_Angeles");
 * // Returns date showing 11 AM PST
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string,
): Date {
  // Validate both timezones to ensure they're valid
  if (!validateTimezone(fromTimezone)) {
    throw new Error(`Invalid source timezone: ${fromTimezone}`);
  }
  if (!validateTimezone(toTimezone)) {
    throw new Error(`Invalid target timezone: ${toTimezone}`);
  }

  // Convert the UTC date to the target timezone
  // The fromTimezone parameter ensures API consistency and validates the source
  return toZonedTime(date, toTimezone);
}

/**
 * Converts a date to a specific timezone for display
 * Takes a UTC date and converts it to the local time in the specified timezone
 * @param date - The date to convert (assumed to be in UTC)
 * @param timezone - The target timezone (IANA format)
 * @returns The date in the target timezone
 */
export function convertToUserTimezone(date: Date, timezone: string): Date {
  if (!validateTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  return toZonedTime(date, timezone);
}

/**
 * Formats a date in a specific timezone
 * @param date - The date to format (in UTC or already converted)
 * @param timezone - The timezone to format in (IANA format)
 * @param formatString - The format string (date-fns format)
 * @param isAlreadyConverted - Whether the date has already been converted to the target timezone
 * @returns The formatted date string
 */
export function formatEventTime(
  date: Date,
  timezone: string,
  formatString: string = "PPpp",
  isAlreadyConverted: boolean = false,
): string {
  if (!validateTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // If the date has already been converted (via toZonedTime), use regular format
  // Otherwise, use formatInTimeZone to do the conversion
  if (isAlreadyConverted) {
    return format(date, formatString);
  }

  return formatInTimeZone(date, timezone, formatString);
}

/**
 * Gets the timezone offset in minutes for a specific date and timezone
 * This accounts for DST (Daylight Saving Time) transitions
 * @param timezone - The timezone (IANA format)
 * @param date - The date to get the offset for
 * @returns The offset in minutes
 */
export function getTimezoneOffset(timezone: string, date: Date): number {
  if (!validateTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // Use Intl.DateTimeFormat to get the offset
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  });

  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((part) => part.type === "timeZoneName");

  if (!offsetPart || !offsetPart.value) {
    return 0;
  }

  // Parse offset string like "GMT+5:30" or "GMT-8"
  const match = offsetPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2] || "0", 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
}

/**
 * Formats a date with timezone information
 * @param date - The date to format (in UTC)
 * @param timezone - The timezone to format in (IANA format)
 * @returns Object with formatted date and timezone info
 */
export function formatDateWithTimezone(
  date: Date,
  timezone: string,
): {
  formatted: string;
  timezone: string;
  offset: string;
} {
  if (!validateTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  const formatted = formatInTimeZone(date, timezone, "PPpp");
  const offset = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? "+" : "-";
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

  return {
    formatted,
    timezone,
    offset: offsetString,
  };
}

/**
 * Checks if a timezone observes DST (Daylight Saving Time)
 * @param timezone - The timezone to check (IANA format)
 * @returns true if the timezone observes DST
 */
export function observesDST(timezone: string): boolean {
  if (!validateTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // Check offset in January and July
  const january = new Date(new Date().getFullYear(), 0, 1);
  const july = new Date(new Date().getFullYear(), 6, 1);

  const janOffset = getTimezoneOffset(timezone, january);
  const julyOffset = getTimezoneOffset(timezone, july);

  return janOffset !== julyOffset;
}

/**
 * Gets the user's local timezone
 * @returns The user's IANA timezone string
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * Converts event data to include timezone-aware timestamps
 * @param event - The event object
 * @param userTimezone - The user's timezone (IANA format)
 * @returns Event with converted times
 */
export function convertEventToUserTimezone<
  T extends { startTime: Date; endTime?: Date | null; timezone: string },
>(
  event: T,
  userTimezone: string,
): T & { displayStartTime: Date; displayEndTime?: Date | null } {
  if (!validateTimezone(userTimezone)) {
    throw new Error(`Invalid user timezone: ${userTimezone}`);
  }

  const displayStartTime = convertToUserTimezone(event.startTime, userTimezone);
  const displayEndTime = event.endTime
    ? convertToUserTimezone(event.endTime, userTimezone)
    : null;

  return {
    ...event,
    displayStartTime,
    displayEndTime,
  };
}

/**
 * Gets a list of all common timezones
 * @returns Array of timezone objects with name and offset
 */
export function getCommonTimezones(): Array<{
  value: string;
  label: string;
  offset: string;
}> {
  const now = new Date();
  return COMMON_TIMEZONES.map((tz) => {
    const offset = getTimezoneOffset(tz, now);
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? "+" : "-";
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

    return {
      value: tz,
      label: `${tz.replace(/_/g, " ")} (GMT${offsetString})`,
      offset: offsetString,
    };
  });
}
