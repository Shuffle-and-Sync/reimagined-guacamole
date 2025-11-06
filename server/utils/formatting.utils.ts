/**
 * Formatting Utilities
 *
 * Common formatting functions for dates, times, strings, numbers, and currency.
 * Consolidates formatting logic to reduce duplication across the codebase.
 *
 * @module formatting.utils
 */

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Format date to human-readable string (e.g., "Jan 15, 2024")
 */
export function formatDateHuman(
  date: Date | string,
  includeYear = true,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  if (includeYear) {
    options.year = "numeric";
  }

  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Format date to long format (e.g., "January 15, 2024")
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format time to HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Format time to 12-hour format (e.g., "3:30 PM")
 */
export function formatTime12Hour(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Format datetime to ISO string
 */
export function formatDateTimeISO(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return d.toISOString();
}

/**
 * Format datetime to human-readable string (e.g., "Jan 15, 2024 at 3:30 PM")
 */
export function formatDateTimeHuman(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const isPast = diffMs < 0;
  const suffix = isPast ? "ago" : "from now";
  const prefix = isPast ? "" : "in ";

  if (diffYear > 0) {
    return `${prefix}${diffYear} ${diffYear === 1 ? "year" : "years"} ${suffix}`;
  }
  if (diffMonth > 0) {
    return `${prefix}${diffMonth} ${diffMonth === 1 ? "month" : "months"} ${suffix}`;
  }
  if (diffWeek > 0) {
    return `${prefix}${diffWeek} ${diffWeek === 1 ? "week" : "weeks"} ${suffix}`;
  }
  if (diffDay > 0) {
    return `${prefix}${diffDay} ${diffDay === 1 ? "day" : "days"} ${suffix}`;
  }
  if (diffHour > 0) {
    return `${prefix}${diffHour} ${diffHour === 1 ? "hour" : "hours"} ${suffix}`;
  }
  if (diffMin > 0) {
    return `${prefix}${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ${suffix}`;
  }

  return "just now";
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  if (!str) return "";
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "...",
): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Truncate string at word boundary
 */
export function truncateWords(
  str: string,
  maxWords: number,
  suffix = "...",
): string {
  if (!str) return "";
  const words = str.split(/\s+/);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(" ") + suffix;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format number as percentage
 */
export function formatPercentage(num: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  decimals = 2,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format bytes per second to human-readable string
 */
export function formatBytesPerSecond(bytesPerSec: number): string {
  return `${formatFileSize(bytesPerSec)}/s`;
}

/**
 * Format phone number (US format)
 */
export function formatPhoneUS(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Format social media handle (remove @ if present)
 */
export function formatSocialHandle(handle: string, addAt = false): string {
  if (!handle) return "";
  const cleaned = handle.trim().replace(/^@/, "");
  return addAt ? `@${cleaned}` : cleaned;
}

/**
 * Format URL to display format (remove protocol, trailing slash)
 */
export function formatUrlDisplay(url: string): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/**
 * Pluralize word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Format count with word (e.g., "1 item", "5 items")
 */
export function formatCount(
  count: number,
  singular: string,
  plural?: string,
): string {
  return `${formatNumber(count)} ${pluralize(count, singular, plural)}`;
}

/**
 * Format list with commas and "and"
 */
export function formatList(items: string[], conjunction = "and"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const allButLast = items.slice(0, -1).join(", ");
  const last = items[items.length - 1]!;

  return `${allButLast}, ${conjunction} ${last}`;
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  let previous: string;
  let result = html;
  do {
    previous = result;
    result = result.replace(/<[^>]*>/g, "");
  } while (result !== previous);
  return result;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Format initials from name
 */
export function getInitials(name: string, maxLength = 2): string {
  if (!name) return "";

  const words = name.trim().split(/\s+/);
  const initials = words
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join("");

  return initials;
}
