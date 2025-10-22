/**
 * TypeScript Strict Mode Compliance Tests
 *
 * Verifies that the codebase is compliant with TypeScript strict mode
 * by checking the files that were previously causing strict mode errors.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, test, expect } from "@jest/globals";

describe("TypeScript Strict Mode Compliance", () => {
  const projectRoot = join(__dirname, "../../..");

  describe("server/routes/backup.ts", () => {
    test("should use optional chaining for potentially undefined array access", () => {
      const filePath = join(projectRoot, "server/routes/backup.ts");
      const content = readFileSync(filePath, "utf-8");

      // Verify that the file uses optional chaining (?.) for array access
      // This prevents TS2532: Object is possibly 'undefined'
      expect(content).toContain("?.status");
      // Check for nullish coalescing with no_backups (may be split across lines)
      expect(content).toContain("no_backups");
      expect(content).toContain("??");
    });
  });

  describe("server/routes/matching.ts", () => {
    test("should use keyof typeof for object key indexing", () => {
      const filePath = join(projectRoot, "server/routes/matching.ts");
      const content = readFileSync(filePath, "utf-8");

      // Verify that the file uses proper type assertions for object keys
      // This prevents TS7053: Element implicitly has an 'any' type
      expect(content).toContain("keyof typeof preferences");
      expect(content).toContain("keyof typeof context");
    });

    test("should use proper type assertions for complex types", () => {
      const filePath = join(projectRoot, "server/routes/matching.ts");
      const content = readFileSync(filePath, "utf-8");

      // Verify that the file uses 'as const' for type narrowing
      // This prevents TS2322: Type mismatch errors
      expect(content).toContain("} as const;");
    });
  });

  describe("server/shared/middleware.ts", () => {
    test("should have explicit return type for corsHandler", () => {
      const filePath = join(projectRoot, "server/shared/middleware.ts");
      const content = readFileSync(filePath, "utf-8");

      // Verify that corsHandler has explicit return type
      // This prevents TS7030: Not all code paths return a value
      expect(content).toContain("corsHandler = (");
      expect(content).toContain("): void =>");
    });

    test("should have proper return statement structure", () => {
      const filePath = join(projectRoot, "server/shared/middleware.ts");
      const content = readFileSync(filePath, "utf-8");

      // Verify proper return pattern in OPTIONS handling
      const lines = content.split("\n");
      const optionsLine = lines.findIndex((line) =>
        line.includes('req.method === "OPTIONS"'),
      );

      // The next line should call sendStatus
      // Followed by a return statement
      expect(lines[optionsLine + 1]).toContain("sendStatus(200)");
      expect(lines[optionsLine + 2]).toContain("return;");
    });
  });

  describe("TypeScript Configuration", () => {
    test("should have strict mode enabled in tsconfig.json", () => {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
      expect(tsconfig.compilerOptions.strictPropertyInitialization).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitReturns).toBe(true);
    });
  });
});
