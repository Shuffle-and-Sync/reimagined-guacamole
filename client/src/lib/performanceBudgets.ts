/**
 * Performance budgets for the application
 * These values are used to track and ensure performance standards
 */

export const PERFORMANCE_BUDGETS = {
  // Component render times (ms) - aim for 60fps (16.67ms per frame)
  components: {
    Calendar: 16,
    CalendarGrid: 16,
    CalendarDay: 5,
    EventList: 16,
    EventCard: 10,
    EventModal: 50,
    EventForm: 50,
    TournamentCard: 10,
    TournamentList: 16,
  },

  // Bundle sizes (KB)
  bundles: {
    mainBundle: 200,
    vendorBundle: 300,
    reactVendor: 150,
    uiVendor: 150,
    stateVendor: 100,
    utilsVendor: 100,
    visualVendor: 100,
  },

  // Core Web Vitals
  webVitals: {
    // Largest Contentful Paint (ms)
    LCP: 2500,
    // First Input Delay (ms)
    FID: 100,
    // Cumulative Layout Shift (score)
    CLS: 0.1,
    // First Contentful Paint (ms)
    FCP: 1500,
    // Time to Interactive (ms)
    TTI: 3000,
    // Total Blocking Time (ms)
    TBT: 300,
  },

  // Page load times (ms)
  pages: {
    landing: 2000,
    calendar: 3000,
    tournaments: 3000,
    profile: 2500,
    settings: 2500,
  },

  // API response times (ms)
  api: {
    events: 500,
    tournaments: 500,
    users: 300,
    communities: 300,
  },
} as const;

/**
 * Check if a value is within budget
 */
export function isWithinBudget(
  category: keyof typeof PERFORMANCE_BUDGETS,
  key: string,
  value: number,
): boolean {
  const budget = PERFORMANCE_BUDGETS[category] as Record<string, number>;
  const limit = budget[key];

  if (limit === undefined) {
    console.warn(`No budget defined for ${category}.${key}`);
    return true;
  }

  return value <= limit;
}

/**
 * Get budget for a specific metric
 */
export function getBudget(
  category: keyof typeof PERFORMANCE_BUDGETS,
  key: string,
): number | undefined {
  const budget = PERFORMANCE_BUDGETS[category] as Record<string, number>;
  return budget[key];
}

/**
 * Calculate budget utilization percentage
 */
export function getBudgetUtilization(
  category: keyof typeof PERFORMANCE_BUDGETS,
  key: string,
  value: number,
): number {
  const budget = getBudget(category, key);
  if (!budget) return 0;

  return (value / budget) * 100;
}

/**
 * Get budget status
 */
export function getBudgetStatus(
  category: keyof typeof PERFORMANCE_BUDGETS,
  key: string,
  value: number,
): "good" | "warning" | "critical" {
  const utilization = getBudgetUtilization(category, key, value);

  if (utilization <= 80) return "good";
  if (utilization <= 100) return "warning";
  return "critical";
}
