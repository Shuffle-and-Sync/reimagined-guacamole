/**
 * Game Stats Rate Limiting Tests
 *
 * Tests for rate limiting implementation on game-stats routes
 * to prevent denial-of-service attacks
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { describe, test, expect } from "@jest/globals";

describe("Game Stats Rate Limiting", () => {
  const routesPath = join(
    process.cwd(),
    "server/features/game-stats/game-stats.routes.ts",
  );

  test("should have game-stats.routes.ts file", () => {
    expect(existsSync(routesPath)).toBe(true);
  });

  test("should import express-rate-limit", () => {
    const routesContent = readFileSync(routesPath, "utf8");
    expect(routesContent).toContain("express-rate-limit");
    expect(routesContent).toMatch(
      /import.*rateLimit.*from.*express-rate-limit/,
    );
  });

  test("should define gameStatsLimiter with correct configuration", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Check that gameStatsLimiter is defined
    expect(routesContent).toContain("gameStatsLimiter");
    expect(routesContent).toMatch(/const\s+gameStatsLimiter\s*=\s*rateLimit/);

    // Check rate limit window (15 minutes)
    expect(routesContent).toMatch(/windowMs:\s*15\s*\*\s*60\s*\*\s*1000/);

    // Check max requests (100 per window)
    expect(routesContent).toMatch(/max:\s*100/);

    // Check error message
    expect(routesContent).toContain("Too many requests for game stats");

    // Check standardHeaders is enabled
    expect(routesContent).toMatch(/standardHeaders:\s*true/);

    // Check legacyHeaders is disabled
    expect(routesContent).toMatch(/legacyHeaders:\s*false/);
  });

  test("should apply rate limiting to /game-results GET route", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Find the /game-results GET route definition
    const gameResultsRouteMatch = routesContent.match(
      /router\.get\(\s*["']\/game-results["']\s*,\s*([^,]+)\s*,/,
    );

    expect(gameResultsRouteMatch).not.toBeNull();

    // Check that gameStatsLimiter is the first middleware
    expect(gameResultsRouteMatch?.[1].trim()).toBe("gameStatsLimiter");
  });

  test("should apply rate limiting before requireAuth middleware on /game-results", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Extract the /game-results GET route section
    const gameResultsSection = routesContent.match(
      /router\.get\(\s*["']\/game-results["']\s*,[\s\S]*?async\s*\(/,
    )?.[0];

    expect(gameResultsSection).toBeTruthy();

    // Ensure gameStatsLimiter comes before requireAuth
    const limiterIndex = gameResultsSection?.indexOf("gameStatsLimiter") ?? -1;
    const authIndex = gameResultsSection?.indexOf("requireAuth") ?? -1;

    expect(limiterIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeGreaterThan(-1);
    expect(limiterIndex).toBeLessThan(authIndex);
  });

  test("should apply rate limiting to main /game-stats GET route", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Check for rate limiting on the root route
    const rootRouteMatch = routesContent.match(
      /router\.get\(\s*["']\/["']\s*,\s*([^,]+)\s*,\s*([^,]+)/,
    );

    expect(rootRouteMatch).not.toBeNull();

    // Either first or second middleware should be gameStatsLimiter
    const firstMiddleware = rootRouteMatch?.[1].trim();
    expect(firstMiddleware).toBe("gameStatsLimiter");
  });

  test("should apply rate limiting to /aggregate route", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Check for rate limiting on the aggregate route
    const aggregateRouteMatch = routesContent.match(
      /router\.get\(\s*["']\/aggregate["']\s*,\s*([^,]+)\s*,/,
    );

    expect(aggregateRouteMatch).not.toBeNull();
    expect(aggregateRouteMatch?.[1].trim()).toBe("gameStatsLimiter");
  });

  test("should apply rate limiting to /leaderboard route", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Check for rate limiting on the leaderboard route
    const leaderboardRouteMatch = routesContent.match(
      /router\.get\(\s*["']\/leaderboard["']\s*,\s*([^,]+)\s*,/,
    );

    expect(leaderboardRouteMatch).not.toBeNull();
    expect(leaderboardRouteMatch?.[1].trim()).toBe("gameStatsLimiter");
  });

  test("should have rate limiting configured with TypeScript types", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // Check that the import is properly typed (not using require)
    expect(routesContent).toMatch(/import.*rateLimit.*from/);
    expect(routesContent).not.toContain("require('express-rate-limit')");
  });

  test("should document rate limiting in file header comments", () => {
    const routesContent = readFileSync(routesPath, "utf8");

    // The file should mention rate limiting in the header
    const headerMatch = routesContent.match(/\/\*\*[\s\S]*?\*\//);
    expect(headerMatch).not.toBeNull();
    expect(headerMatch?.[0]).toContain("Rate limiting");
  });
});
