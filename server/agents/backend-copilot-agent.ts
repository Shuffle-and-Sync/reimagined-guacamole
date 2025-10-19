/**
 * Backend Copilot Agent for Shuffle & Sync
 *
 * A comprehensive agent that reviews, debugs, and provides recommendations
 * for the TypeScript/Express.js backend codebase following GitHub Copilot best practices.
 */

import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";
import { analyzeDrizzleUsage } from "./drizzle-analyzer";

// Types for analysis results
export interface CodeIssue {
  file: string;
  line: number;
  column?: number;
  severity: "error" | "warning" | "info";
  category:
    | "typescript"
    | "express"
    | "drizzle"
    | "security"
    | "performance"
    | "style";
  message: string;
  rule?: string;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface AnalysisResult {
  totalFiles: number;
  totalIssues: number;
  issuesByCategory: Record<string, number>;
  issues: CodeIssue[];
  summary: string;
  recommendations: string[];
}

export interface CopilotAgentConfig {
  projectRoot: string;
  includePatterns: string[];
  excludePatterns: string[];
  enableAutoFix: boolean;
  enableSecurityScanning: boolean;
  enablePerformanceAnalysis: boolean;
}

/**
 * Main Backend Copilot Agent class
 */
export class BackendCopilotAgent {
  private config: CopilotAgentConfig;
  private readonly serverPath: string;

  constructor(config: Partial<CopilotAgentConfig> = {}) {
    this.config = {
      projectRoot: process.cwd(),
      includePatterns: ["server/**/*.ts", "shared/**/*.ts"],
      excludePatterns: ["**/*.test.ts", "**/node_modules/**", "**/dist/**"],
      enableAutoFix: true,
      enableSecurityScanning: true,
      enablePerformanceAnalysis: true,
      ...config,
    };

    this.serverPath = path.join(this.config.projectRoot, "server");
  }

  /**
   * Run comprehensive backend code analysis
   */
  async analyzeBackend(): Promise<AnalysisResult> {
    logger.info("🤖 Starting Backend Copilot Agent analysis...");

    const issues: CodeIssue[] = [];
    let totalFiles = 0;

    try {
      // 1. TypeScript Analysis
      logger.info("📝 Running TypeScript analysis...");
      const tsIssues = await this.analyzeTypeScript();
      issues.push(...tsIssues);

      // 2. Express.js Pattern Analysis
      logger.info("🚀 Analyzing Express.js patterns...");
      const expressIssues = await this.analyzeExpressPatterns();
      issues.push(...expressIssues);

      // 3. Drizzle ORM Analysis
      logger.info("🗄️ Analyzing Drizzle ORM usage...");
      const drizzleAnalysis = await analyzeDrizzleUsage(
        this.config.projectRoot,
      );
      issues.push(...drizzleAnalysis.issues);

      // Add Drizzle-specific recommendations
      if (drizzleAnalysis.optimizationSuggestions.length > 0) {
        logger.info(
          `📊 Found ${drizzleAnalysis.totalQueries} database queries with ${drizzleAnalysis.optimizationSuggestions.length} optimization opportunities`,
        );
      }

      // 4. Security Analysis
      if (this.config.enableSecurityScanning) {
        logger.info("🔒 Running security analysis...");
        const securityIssues = await this.analyzeSecurityPatterns();
        issues.push(...securityIssues);
      }

      // Count files analyzed
      totalFiles = await this.countAnalyzedFiles();

      // Generate summary and recommendations
      const issuesByCategory = this.categorizeIssues(issues);
      const summary = this.generateSummary(
        totalFiles,
        issues,
        issuesByCategory,
      );
      const recommendations = this.generateRecommendations(issues);

      const result: AnalysisResult = {
        totalFiles,
        totalIssues: issues.length,
        issuesByCategory,
        issues,
        summary,
        recommendations,
      };

      logger.info(
        `✅ Analysis complete: ${issues.length} issues found in ${totalFiles} files`,
      );
      return result;
    } catch (error) {
      logger.error("❌ Backend analysis failed:", error);
      throw error;
    }
  }

  /**
   * Analyze TypeScript compliance and patterns
   */
  private async analyzeTypeScript(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    try {
      const serverFiles = await this.getServerFiles();

      for (const file of serverFiles) {
        const content = await fs.readFile(file, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          // 1. Any type usage
          if (line.includes(": any") || line.includes("<any>")) {
            issues.push({
              file: path.relative(this.config.projectRoot, file),
              line: index + 1,
              severity: "warning",
              category: "typescript",
              message: 'Usage of "any" type reduces type safety',
              rule: "no-any",
              suggestion: 'Use specific types instead of "any"',
              autoFixable: false,
            });
          }

          // 2. Non-null assertion usage
          if (line.includes("!.") || line.includes("! ")) {
            issues.push({
              file: path.relative(this.config.projectRoot, file),
              line: index + 1,
              severity: "info",
              category: "typescript",
              message: "Non-null assertion operator usage",
              rule: "no-non-null-assertion",
              suggestion:
                "Consider using optional chaining or proper null checks",
              autoFixable: false,
            });
          }
        });
      }
    } catch (error) {
      logger.warn("TypeScript analysis had issues:", error);
    }

    return issues;
  }

  /**
   * Analyze Express.js patterns and middleware usage
   */
  private async analyzeExpressPatterns(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    const serverFiles = await this.getServerFiles();

    for (const file of serverFiles) {
      if (!file.includes(".routes.") && !file.includes("middleware")) continue;

      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // 1. Missing error handling in async routes
        if (line.includes("async (req, res") && !content.includes("try {")) {
          issues.push({
            file: path.relative(this.config.projectRoot, file),
            line: index + 1,
            severity: "error",
            category: "express",
            message: "Async route handler missing error handling",
            rule: "async-error-handling",
            suggestion:
              "Wrap async route handlers with try-catch or use asyncHandler middleware",
            autoFixable: false,
          });
        }

        // 2. Missing input validation
        if (
          line.includes("req.body") &&
          !content.includes("zod") &&
          !content.includes("validate")
        ) {
          issues.push({
            file: path.relative(this.config.projectRoot, file),
            line: index + 1,
            severity: "warning",
            category: "express",
            message: "Request body used without validation",
            rule: "input-validation",
            suggestion: "Add Zod schema validation for request body",
            autoFixable: false,
          });
        }
      });
    }

    return issues;
  }

  /**
   * Analyze security patterns and vulnerabilities
   */
  private async analyzeSecurityPatterns(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    const serverFiles = await this.getServerFiles();

    for (const file of serverFiles) {
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // 1. Missing HTTPS enforcement
        if (line.includes("http://") && !line.includes("localhost")) {
          issues.push({
            file: path.relative(this.config.projectRoot, file),
            line: index + 1,
            severity: "warning",
            category: "security",
            message: "HTTP URL detected (should use HTTPS)",
            rule: "enforce-https",
            suggestion: "Use HTTPS URLs for production endpoints",
            autoFixable: true,
          });
        }

        // 2. Console.log in production code
        if (line.includes("console.log") && !file.includes("logger")) {
          issues.push({
            file: path.relative(this.config.projectRoot, file),
            line: index + 1,
            severity: "warning",
            category: "security",
            message: "Console.log usage detected",
            rule: "no-console-log",
            suggestion: "Use structured logging instead of console.log",
            autoFixable: false,
          });
        }
      });
    }

    return issues;
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
      } catch (error) {
        // Skip directories that can't be read
      }
    }

    await scanDirectory(this.serverPath);
    return files;
  }

  /**
   * Count total files analyzed
   */
  private async countAnalyzedFiles(): Promise<number> {
    const files = await this.getServerFiles();
    return files.length;
  }

  /**
   * Categorize issues by type
   */
  private categorizeIssues(issues: CodeIssue[]): Record<string, number> {
    const categories: Record<string, number> = {};

    issues.forEach((issue) => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });

    return categories;
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(
    totalFiles: number,
    issues: CodeIssue[],
    categories: Record<string, number>,
  ): string {
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    let summary = `Backend Copilot Agent Analysis Summary:\n`;
    summary += `- Files analyzed: ${totalFiles}\n`;
    summary += `- Total issues: ${issues.length}\n`;
    summary += `  - Errors: ${errorCount}\n`;
    summary += `  - Warnings: ${warningCount}\n`;
    summary += `  - Info: ${infoCount}\n\n`;

    summary += `Issues by category:\n`;
    Object.entries(categories).forEach(([category, count]) => {
      summary += `  - ${category}: ${count}\n`;
    });

    return summary;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(issues: CodeIssue[]): string[] {
    const recommendations: string[] = [];
    const categories = this.categorizeIssues(issues);

    if ((categories.typescript ?? 0) > 0) {
      recommendations.push(
        "🔧 Fix TypeScript errors to improve type safety and prevent runtime issues",
      );
    }

    if ((categories.express ?? 0) > 0) {
      recommendations.push(
        "🚀 Improve Express.js patterns: add error handling, input validation, and proper separation of concerns",
      );
    }

    if ((categories.drizzle ?? 0) > 0) {
      recommendations.push(
        "🗄️ Optimize Drizzle ORM usage: use transactions, proper indexing, and efficient query patterns",
      );
    }

    if ((categories.performance ?? 0) > 0) {
      recommendations.push(
        "⚡ Improve performance: add database indexing, implement pagination, optimize queries",
      );
    }

    if ((categories.security ?? 0) > 0) {
      recommendations.push(
        "🔒 Address security vulnerabilities: remove hardcoded credentials, prevent SQL injection",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "✅ Backend code follows best practices - great work!",
      );
    }

    return recommendations;
  }

  /**
   * Generate detailed report
   */
  generateReport(result: AnalysisResult): string {
    let report = `# Backend Copilot Agent Report\n\n`;
    report += `${result.summary}\n\n`;

    report += `## Recommendations\n\n`;
    result.recommendations.forEach((rec) => {
      report += `- ${rec}\n`;
    });

    report += `\n## Detailed Issues\n\n`;

    const issuesByFile = result.issues.reduce(
      (acc, issue) => {
        if (!acc[issue.file]) acc[issue.file] = [];
        acc[issue.file]!.push(issue);
        return acc;
      },
      {} as Record<string, CodeIssue[]>,
    );

    Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
      report += `### ${file}\n\n`;
      fileIssues.forEach((issue) => {
        const severity =
          issue.severity === "error"
            ? "🚨"
            : issue.severity === "warning"
              ? "⚠️"
              : "ℹ️";
        report += `${severity} **Line ${issue.line}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `   💡 *${issue.suggestion}*\n`;
        }
        report += `\n`;
      });
    });

    return report;
  }
}

/**
 * Convenience function to run backend analysis
 */
export async function runBackendAnalysis(
  config?: Partial<CopilotAgentConfig>,
): Promise<AnalysisResult> {
  const agent = new BackendCopilotAgent(config);
  return await agent.analyzeBackend();
}

/**
 * Convenience function to generate and save report
 */
export async function generateBackendReport(
  outputPath: string,
  config?: Partial<CopilotAgentConfig>,
): Promise<void> {
  const agent = new BackendCopilotAgent(config);
  const result = await agent.analyzeBackend();

  const report = agent.generateReport(result);
  await fs.writeFile(outputPath, report);

  logger.info(`📊 Backend analysis report saved to: ${outputPath}`);
}
