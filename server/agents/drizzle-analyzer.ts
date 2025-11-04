/**
 * Drizzle ORM Specialized Analyzer
 *
 * Advanced analysis module specifically for Drizzle ORM usage patterns,
 * performance optimization, and best practices in the Shuffle & Sync backend.
 */

import fs from "fs/promises";
import path from "path";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import type { CodeIssue } from "./backend-copilot-agent";

export interface DrizzleAnalysisResult {
  totalQueries: number;
  issues: CodeIssue[];
  optimizationSuggestions: string[];
  performanceMetrics: {
    queriesWithoutIndexes: number;
    queriesWithoutTransactions: number;
    potentialN1Problems: number;
    missingPagination: number;
  };
}

/**
 * Drizzle ORM Analyzer
 */
export class DrizzleAnalyzer {
  private projectRoot: string;
  private serverPath: string;

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.serverPath = path.join(projectRoot, "server");
  }

  /**
   * Run comprehensive Drizzle ORM analysis
   */
  async analyzeDrizzleUsage(): Promise<DrizzleAnalysisResult> {
    logger.info("🗄️ Starting Drizzle ORM analysis...");

    const issues: CodeIssue[] = [];
    const optimizationSuggestions: string[] = [];
    let totalQueries = 0;

    const performanceMetrics = {
      queriesWithoutIndexes: 0,
      queriesWithoutTransactions: 0,
      potentialN1Problems: 0,
      missingPagination: 0,
    };

    try {
      const files = await this.getServerFiles();

      for (const file of files) {
        const content = await fs.readFile(file, "utf-8");
        const lines = content.split("\n");

        // Count queries
        const queryCount = this.countQueries(content);
        totalQueries += queryCount;

        // Analyze each line for issues
        lines.forEach((line, index) => {
          this.analyzeQueryPerformance(
            file,
            line,
            index + 1,
            content,
            issues,
            performanceMetrics,
          );
          this.analyzeTransactionUsage(
            file,
            line,
            index + 1,
            content,
            issues,
            performanceMetrics,
          );
          this.analyzeRelationshipPatterns(
            file,
            line,
            index + 1,
            content,
            issues,
            performanceMetrics,
          );
          this.analyzeTypeUsage(file, line, index + 1, content, issues);
        });
      }

      // Generate optimization suggestions
      optimizationSuggestions.push(
        ...this.generateOptimizationSuggestions(performanceMetrics),
      );

      logger.info(
        `✅ Drizzle analysis complete: ${totalQueries} queries analyzed, ${issues.length} issues found`,
      );

      return {
        totalQueries,
        issues,
        optimizationSuggestions,
        performanceMetrics,
      };
    } catch (error) {
      logger.error("❌ Drizzle analysis failed:", toLoggableError(error));
      throw error;
    }
  }

  /**
   * Count database queries in content
   */
  private countQueries(content: string): number {
    const queryPatterns = [
      /db\.select/g,
      /db\.insert/g,
      /db\.update/g,
      /db\.delete/g,
    ];

    return queryPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches?.length || 0);
    }, 0);
  }

  /**
   * Analyze query performance patterns
   */
  private analyzeQueryPerformance(
    file: string,
    line: string,
    lineNumber: number,
    content: string,
    issues: CodeIssue[],
    metrics: DrizzleAnalysisResult["performanceMetrics"],
  ): void {
    const relativePath = path.relative(this.projectRoot, file);

    // 1. Select queries without WHERE clauses (potential full table scans)
    if (
      line.includes("db.select") &&
      !line.includes("where") &&
      !content.includes(".where(")
    ) {
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "warning",
        category: "drizzle",
        message: "SELECT query without WHERE clause may cause full table scan",
        rule: "add-where-clause",
        suggestion:
          "Add WHERE clause to limit query results and improve performance",
        autoFixable: false,
      });
    }

    // 2. Queries that could benefit from indexing
    if (line.includes(".where(") && !content.includes("index")) {
      metrics.queriesWithoutIndexes++;
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "info",
        category: "performance",
        message: "Query may benefit from database indexing",
        rule: "consider-indexing",
        suggestion:
          "Consider adding database indexes for frequently queried columns",
        autoFixable: false,
      });
    }

    // 3. Missing pagination on list queries
    if (
      (line.includes("db.select") || line.includes(".findMany")) &&
      !content.includes("limit") &&
      !content.includes("take") &&
      file.includes(".routes.")
    ) {
      metrics.missingPagination++;
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "warning",
        category: "performance",
        message: "List query without pagination",
        rule: "add-pagination",
        suggestion:
          "Add limit/offset or cursor-based pagination to prevent large result sets",
        autoFixable: false,
      });
    }

    // 4. N+1 Query problem detection
    if (line.includes("for (") || line.includes("forEach(")) {
      const nextFewLines = content
        .split("\n")
        .slice(lineNumber, lineNumber + 5)
        .join("\n");
      if (
        nextFewLines.includes("db.select") ||
        nextFewLines.includes("db.query")
      ) {
        metrics.potentialN1Problems++;
        issues.push({
          file: relativePath,
          line: lineNumber,
          severity: "error",
          category: "performance",
          message: "Potential N+1 query problem detected",
          rule: "fix-n-plus-one",
          suggestion:
            "Use joins or batch queries instead of queries inside loops",
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Analyze transaction usage patterns
   */
  private analyzeTransactionUsage(
    file: string,
    line: string,
    lineNumber: number,
    content: string,
    issues: CodeIssue[],
    metrics: DrizzleAnalysisResult["performanceMetrics"],
  ): void {
    const relativePath = path.relative(this.projectRoot, file);

    // Multiple operations without transaction
    const hasMultipleOperations =
      (content.match(/db\.insert/g)?.length || 0) +
        (content.match(/db\.update/g)?.length || 0) +
        (content.match(/db\.delete/g)?.length || 0) >
      1;

    if (
      hasMultipleOperations &&
      !content.includes("db.transaction") &&
      (line.includes("db.insert") ||
        line.includes("db.update") ||
        line.includes("db.delete"))
    ) {
      metrics.queriesWithoutTransactions++;
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "warning",
        category: "drizzle",
        message: "Multiple database operations should use transactions",
        rule: "use-transactions",
        suggestion:
          "Wrap multiple related database operations in a transaction for data consistency",
        autoFixable: false,
      });
    }
  }

  /**
   * Analyze relationship and join patterns
   */
  private analyzeRelationshipPatterns(
    file: string,
    line: string,
    lineNumber: number,
    content: string,
    issues: CodeIssue[],
    _metrics: DrizzleAnalysisResult["performanceMetrics"],
  ): void {
    const relativePath = path.relative(this.projectRoot, file);

    // Missing eager loading for relationships
    if (
      line.includes("db.select") &&
      content.includes("relations") &&
      !content.includes("with:")
    ) {
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "info",
        category: "drizzle",
        message: "Consider using eager loading for related data",
        rule: "use-eager-loading",
        suggestion:
          'Use "with" clause to eagerly load related data and avoid N+1 queries',
        autoFixable: false,
      });
    }

    // Inefficient joins
    if (
      line.includes(".leftJoin") ||
      line.includes(".rightJoin") ||
      line.includes(".innerJoin")
    ) {
      if (!content.includes("on(")) {
        issues.push({
          file: relativePath,
          line: lineNumber,
          severity: "error",
          category: "drizzle",
          message: "Join query missing ON clause",
          rule: "add-join-condition",
          suggestion: "Add proper ON condition to join queries",
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Analyze type usage in Drizzle queries
   */
  private analyzeTypeUsage(
    file: string,
    line: string,
    lineNumber: number,
    _content: string,
    issues: CodeIssue[],
  ): void {
    const relativePath = path.relative(this.projectRoot, file);

    // Missing type annotations on query results
    if (
      line.includes("db.select") &&
      !line.includes(": ") &&
      line.includes("=")
    ) {
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "info",
        category: "typescript",
        message: "Query result missing type annotation",
        rule: "add-query-types",
        suggestion:
          "Add explicit type annotation for query results to improve type safety",
        autoFixable: false,
      });
    }

    // Use of any type in query operations
    if (
      (line.includes("db.") || line.includes("query.")) &&
      line.includes(": any")
    ) {
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: "warning",
        category: "typescript",
        message: 'Avoid using "any" type in database queries',
        rule: "no-any-in-queries",
        suggestion: 'Use proper Drizzle-generated types instead of "any"',
        autoFixable: false,
      });
    }
  }

  /**
   * Generate optimization suggestions based on metrics
   */
  private generateOptimizationSuggestions(
    metrics: DrizzleAnalysisResult["performanceMetrics"],
  ): string[] {
    const suggestions: string[] = [];

    if (metrics.queriesWithoutIndexes > 5) {
      suggestions.push(
        "🔍 Consider adding database indexes for frequently queried columns to improve performance",
      );
    }

    if (metrics.queriesWithoutTransactions > 0) {
      suggestions.push(
        "🔄 Implement transactions for multi-operation database workflows to ensure data consistency",
      );
    }

    if (metrics.potentialN1Problems > 0) {
      suggestions.push(
        "⚡ Optimize queries to prevent N+1 problems by using joins or batch operations",
      );
    }

    if (metrics.missingPagination > 3) {
      suggestions.push(
        "📄 Implement pagination for list endpoints to prevent performance issues with large datasets",
      );
    }

    return suggestions;
  }

  /**
   * Get all TypeScript files in the server directory
   */
  private async getServerFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scanDirectory(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (
            entry.isDirectory() &&
            !entry.name.includes("node_modules") &&
            !entry.name.includes("dist")
          ) {
            await scanDirectory(fullPath);
          } else if (
            entry.isFile() &&
            entry.name.endsWith(".ts") &&
            !entry.name.endsWith(".test.ts")
          ) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    await scanDirectory(this.serverPath);
    return files;
  }
}

/**
 * Convenience function to run Drizzle analysis
 */
export async function analyzeDrizzleUsage(
  projectRoot = process.cwd(),
): Promise<DrizzleAnalysisResult> {
  const analyzer = new DrizzleAnalyzer(projectRoot);
  return await analyzer.analyzeDrizzleUsage();
}
