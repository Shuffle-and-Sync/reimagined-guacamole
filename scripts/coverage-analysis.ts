/**
 * Coverage Analysis Script
 *
 * Analyzes test coverage for the Shuffle & Sync codebase
 * - Identifies all source files
 * - Identifies all test files
 * - Maps tests to source files
 * - Generates coverage report with gaps
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, relative, dirname, basename } from "path";

interface FileInfo {
  path: string;
  relativePath: string;
  lines: number;
  directory: string;
  hasTest: boolean;
  testFiles: string[];
  category:
    | "feature"
    | "service"
    | "repository"
    | "middleware"
    | "util"
    | "shared"
    | "other";
  risk: "critical" | "high" | "medium" | "low";
}

interface DirectoryStats {
  totalFiles: number;
  testedFiles: number;
  untestedFiles: number;
  totalLines: number;
  coveragePercent: number;
  files: FileInfo[];
}

interface CoverageReport {
  summary: {
    totalFiles: number;
    testedFiles: number;
    untestedFiles: number;
    overallCoverage: number;
    totalLines: number;
  };
  byDirectory: Record<string, DirectoryStats>;
  byCategory: Record<string, DirectoryStats>;
  criticalGaps: FileInfo[];
  recommendations: string[];
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (
        !file.includes("node_modules") &&
        !file.includes(".git") &&
        file !== "dist"
      ) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function countLines(filePath: string): number {
  try {
    const content = readFileSync(filePath, "utf-8");
    // Count non-empty, non-comment lines
    const lines = content.split("\n").filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("/*") &&
        !trimmed.startsWith("*")
      );
    });
    return lines.length;
  } catch (_error) {
    return 0;
  }
}

function categorizeFile(filePath: string): FileInfo["category"] {
  if (filePath.includes("/features/")) return "feature";
  if (filePath.includes("/services/")) return "service";
  if (filePath.includes("/repositories/")) return "repository";
  if (filePath.includes("/middleware/")) return "middleware";
  if (filePath.includes("/utils/")) return "util";
  if (filePath.includes("shared/")) return "shared";
  return "other";
}

function assessRisk(file: FileInfo): FileInfo["risk"] {
  // Critical: Authentication, authorization, data access
  if (
    file.path.includes("auth") ||
    file.path.includes("session") ||
    file.path.includes("security") ||
    file.category === "repository" ||
    file.path.includes("database")
  ) {
    return "critical";
  }

  // High: Core business logic, services
  if (
    file.category === "feature" ||
    file.category === "service" ||
    file.path.includes("tournament") ||
    file.path.includes("matchmaking") ||
    file.path.includes("event")
  ) {
    return "high";
  }

  // Medium: Middleware, utilities with business logic
  if (file.category === "middleware" || file.lines > 50) {
    return "medium";
  }

  // Low: Simple utilities, type definitions
  return "low";
}

function findTestFiles(sourceFile: string, allTestFiles: string[]): string[] {
  const baseName = basename(sourceFile, ".ts");

  const matchingTests = allTestFiles.filter((testFile) => {
    // Direct name match (e.g., user.service.ts -> user.service.test.ts)
    if (testFile.includes(baseName + ".test.ts")) {
      return true;
    }

    // Integration tests that might cover this file
    if (testFile.includes("integration") || testFile.includes("e2e")) {
      const testContent = readFileSync(testFile, "utf-8");
      // Check if this source file is imported in the test
      const importPattern = new RegExp(
        `from ['"](.*/${baseName}|.*/${baseName}.ts)['"]`,
      );
      return importPattern.test(testContent);
    }

    return false;
  });

  return matchingTests;
}

function analyzeCodebase(): CoverageReport {
  const rootDir = process.cwd();

  // Get all source files (server and shared)
  const serverFiles = getAllFiles(join(rootDir, "server")).filter(
    (f) => !f.includes("/tests/") && !f.endsWith(".test.ts"),
  );
  const sharedFiles = getAllFiles(join(rootDir, "shared")).filter(
    (f) => !f.includes("/tests/") && !f.endsWith(".test.ts"),
  );

  const allSourceFiles = [...serverFiles, ...sharedFiles];
  const allTestFiles = getAllFiles(join(rootDir, "server/tests"));

  // Analyze each source file
  const fileInfos: FileInfo[] = allSourceFiles.map((filePath) => {
    const relativePath = relative(rootDir, filePath);
    const testFiles = findTestFiles(filePath, allTestFiles);

    const info: FileInfo = {
      path: filePath,
      relativePath,
      lines: countLines(filePath),
      directory: dirname(relativePath),
      hasTest: testFiles.length > 0,
      testFiles: testFiles.map((f) => relative(rootDir, f)),
      category: categorizeFile(filePath),
      risk: "low", // Will be set after
    };

    info.risk = assessRisk(info);
    return info;
  });

  // Group by directory
  const byDirectory: Record<string, DirectoryStats> = {};
  for (const file of fileInfos) {
    const dir = file.directory;
    if (!byDirectory[dir]) {
      byDirectory[dir] = {
        totalFiles: 0,
        testedFiles: 0,
        untestedFiles: 0,
        totalLines: 0,
        coveragePercent: 0,
        files: [],
      };
    }
    byDirectory[dir].totalFiles++;
    byDirectory[dir].totalLines += file.lines;
    byDirectory[dir].files.push(file);
    if (file.hasTest) {
      byDirectory[dir].testedFiles++;
    } else {
      byDirectory[dir].untestedFiles++;
    }
  }

  // Calculate coverage percentages
  for (const dir in byDirectory) {
    const stats = byDirectory[dir];
    stats.coveragePercent = Math.round(
      (stats.testedFiles / stats.totalFiles) * 100,
    );
  }

  // Group by category
  const byCategory: Record<string, DirectoryStats> = {};
  for (const file of fileInfos) {
    const cat = file.category;
    if (!byCategory[cat]) {
      byCategory[cat] = {
        totalFiles: 0,
        testedFiles: 0,
        untestedFiles: 0,
        totalLines: 0,
        coveragePercent: 0,
        files: [],
      };
    }
    byCategory[cat].totalFiles++;
    byCategory[cat].totalLines += file.lines;
    byCategory[cat].files.push(file);
    if (file.hasTest) {
      byCategory[cat].testedFiles++;
    } else {
      byCategory[cat].untestedFiles++;
    }
  }

  // Calculate category coverage
  for (const cat in byCategory) {
    const stats = byCategory[cat];
    stats.coveragePercent = Math.round(
      (stats.testedFiles / stats.totalFiles) * 100,
    );
  }

  // Identify critical gaps
  const criticalGaps = fileInfos
    .filter((f) => !f.hasTest && (f.risk === "critical" || f.risk === "high"))
    .sort((a, b) => {
      // Sort by risk first, then by lines
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[a.risk] - riskOrder[b.risk];
      }
      return b.lines - a.lines;
    });

  // Generate recommendations
  const recommendations: string[] = [];

  const totalTested = fileInfos.filter((f) => f.hasTest).length;
  const overallCoverage = Math.round((totalTested / fileInfos.length) * 100);

  if (overallCoverage < 80) {
    recommendations.push(
      `Overall coverage is ${overallCoverage}%, below the 80% target`,
    );
  }

  const criticalUntested = fileInfos.filter(
    (f) => !f.hasTest && f.risk === "critical",
  );
  if (criticalUntested.length > 0) {
    recommendations.push(
      `${criticalUntested.length} critical files have no tests - IMMEDIATE ACTION REQUIRED`,
    );
  }

  const highRiskUntested = fileInfos.filter(
    (f) => !f.hasTest && f.risk === "high",
  );
  if (highRiskUntested.length > 0) {
    recommendations.push(
      `${highRiskUntested.length} high-risk files have no tests - prioritize for next sprint`,
    );
  }

  // Check specific critical paths
  const authFiles = fileInfos.filter((f) => f.path.includes("auth"));
  const authCoverage =
    (authFiles.filter((f) => f.hasTest).length / authFiles.length) * 100;
  if (authCoverage < 90) {
    recommendations.push(
      `Authentication coverage is ${Math.round(authCoverage)}% - should be 90%+ for security`,
    );
  }

  return {
    summary: {
      totalFiles: fileInfos.length,
      testedFiles: totalTested,
      untestedFiles: fileInfos.length - totalTested,
      overallCoverage,
      totalLines: fileInfos.reduce((sum, f) => sum + f.lines, 0),
    },
    byDirectory,
    byCategory,
    criticalGaps,
    recommendations,
  };
}

function generateMarkdownReport(report: CoverageReport): string {
  const md: string[] = [];

  md.push("# Test Coverage Analysis Report");
  md.push("");
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push("");

  // Executive Summary
  md.push("## Executive Summary");
  md.push("");
  md.push(`- **Total Source Files**: ${report.summary.totalFiles}`);
  md.push(`- **Files with Tests**: ${report.summary.testedFiles}`);
  md.push(`- **Files without Tests**: ${report.summary.untestedFiles}`);
  md.push(`- **Overall Coverage**: ${report.summary.overallCoverage}%`);
  md.push(
    `- **Total Lines of Code**: ${report.summary.totalLines.toLocaleString()}`,
  );
  md.push("");

  // Coverage Status
  const status =
    report.summary.overallCoverage >= 90
      ? "✅ EXCELLENT"
      : report.summary.overallCoverage >= 80
        ? "✓ GOOD"
        : report.summary.overallCoverage >= 70
          ? "⚠️ NEEDS IMPROVEMENT"
          : "❌ CRITICAL - IMMEDIATE ACTION REQUIRED";
  md.push(`**Status**: ${status}`);
  md.push("");

  // Recommendations
  if (report.recommendations.length > 0) {
    md.push("## 🚨 Key Recommendations");
    md.push("");
    for (const rec of report.recommendations) {
      md.push(`- ${rec}`);
    }
    md.push("");
  }

  // Coverage by Category
  md.push("## Coverage by Category");
  md.push("");
  md.push(
    "| Category | Total Files | Tested | Untested | Coverage | Total Lines |",
  );
  md.push(
    "|----------|------------|---------|----------|----------|-------------|",
  );

  const categories = Object.entries(report.byCategory).sort(
    (a, b) => a[1].coveragePercent - b[1].coveragePercent,
  );

  for (const [category, stats] of categories) {
    const emoji =
      stats.coveragePercent >= 80
        ? "✓"
        : stats.coveragePercent >= 50
          ? "⚠️"
          : "❌";
    md.push(
      `| ${category} | ${stats.totalFiles} | ${stats.testedFiles} | ${stats.untestedFiles} | ${emoji} ${stats.coveragePercent}% | ${stats.totalLines} |`,
    );
  }
  md.push("");

  // Coverage by Directory (top-level only)
  md.push("## Coverage by Directory");
  md.push("");
  md.push(
    "| Directory | Total Files | Tested | Untested | Coverage | Total Lines |",
  );
  md.push(
    "|-----------|------------|---------|----------|----------|-------------|",
  );

  const topLevelDirs = Object.entries(report.byDirectory)
    .filter(([dir]) => !dir.includes("/"))
    .sort((a, b) => a[1].coveragePercent - b[1].coveragePercent);

  for (const [dir, stats] of topLevelDirs) {
    const emoji =
      stats.coveragePercent >= 80
        ? "✓"
        : stats.coveragePercent >= 50
          ? "⚠️"
          : "❌";
    md.push(
      `| ${dir} | ${stats.totalFiles} | ${stats.testedFiles} | ${stats.untestedFiles} | ${emoji} ${stats.coveragePercent}% | ${stats.totalLines} |`,
    );
  }
  md.push("");

  // Critical Gaps
  md.push("## 🔴 Critical Test Gaps (Prioritized)");
  md.push("");
  md.push("Files with no test coverage that pose the highest risk:");
  md.push("");

  if (report.criticalGaps.length === 0) {
    md.push("✅ No critical gaps identified!");
  } else {
    md.push("| File | Risk | Lines | Category | Recommended Tests |");
    md.push("|------|------|-------|----------|-------------------|");

    for (const file of report.criticalGaps.slice(0, 30)) {
      const emoji = file.risk === "critical" ? "🔴" : "🟠";
      const testType =
        file.category === "feature"
          ? "Integration + Unit"
          : file.category === "service"
            ? "Unit + Integration"
            : file.category === "repository"
              ? "Integration"
              : "Unit";
      md.push(
        `| ${file.relativePath} | ${emoji} ${file.risk} | ${file.lines} | ${file.category} | ${testType} |`,
      );
    }
  }
  md.push("");

  // Zero Coverage Files
  const zeroCoverage = Object.values(report.byCategory)
    .flatMap((cat) => cat.files)
    .filter((f) => !f.hasTest);

  md.push("## Files with Zero Coverage");
  md.push("");
  md.push(`**Total**: ${zeroCoverage.length} files`);
  md.push("");

  // Group by risk
  const byRisk = {
    critical: zeroCoverage.filter((f) => f.risk === "critical"),
    high: zeroCoverage.filter((f) => f.risk === "high"),
    medium: zeroCoverage.filter((f) => f.risk === "medium"),
    low: zeroCoverage.filter((f) => f.risk === "low"),
  };

  md.push(`- 🔴 **Critical Risk**: ${byRisk.critical.length} files`);
  md.push(`- 🟠 **High Risk**: ${byRisk.high.length} files`);
  md.push(`- 🟡 **Medium Risk**: ${byRisk.medium.length} files`);
  md.push(`- 🟢 **Low Risk**: ${byRisk.low.length} files`);
  md.push("");

  // Detailed breakdown
  for (const [riskLevel, files] of Object.entries(byRisk)) {
    if (files.length > 0) {
      md.push(`### ${riskLevel.toUpperCase()} Risk Files`);
      md.push("");
      for (const file of files) {
        md.push(`- \`${file.relativePath}\` (${file.lines} lines)`);
      }
      md.push("");
    }
  }

  // Testing Recommendations
  md.push("## Testing Recommendations");
  md.push("");
  md.push("### Immediate Actions (This Sprint)");
  md.push("");
  md.push(
    "1. **Add tests for critical files** - Focus on authentication, security, and data access",
  );
  md.push(
    "2. **Fix failing tests** - Address test suite failures to get accurate coverage data",
  );
  md.push(
    "3. **Set up coverage thresholds** - Enforce minimum coverage for new code",
  );
  md.push("");

  md.push("### Short-term Goals (Next 2 Sprints)");
  md.push("");
  md.push(
    "1. **Achieve 80% overall coverage** - Systematically add tests for high-risk untested files",
  );
  md.push(
    "2. **100% coverage for critical paths** - Authentication, authorization, payment processing",
  );
  md.push(
    "3. **Integration test coverage** - End-to-end flows for core features",
  );
  md.push("");

  md.push("### Long-term Goals");
  md.push("");
  md.push(
    "1. **Maintain 90%+ coverage** - Make coverage part of CI/CD pipeline",
  );
  md.push("2. **Mutation testing** - Ensure tests actually validate behavior");
  md.push(
    "3. **Performance testing** - Add load and stress tests for critical endpoints",
  );
  md.push("");

  return md.join("\n");
}

function generateCSVReport(report: CoverageReport): string {
  const csv: string[] = [];

  csv.push("File,Directory,Category,Risk,Lines,Has Test,Test Files");

  const allFiles = Object.values(report.byCategory)
    .flatMap((cat) => cat.files)
    .sort((a, b) => {
      // Sort by risk, then by whether it has tests, then by lines
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[a.risk] - riskOrder[b.risk];
      }
      if (a.hasTest !== b.hasTest) {
        return a.hasTest ? 1 : -1;
      }
      return b.lines - a.lines;
    });

  for (const file of allFiles) {
    const testFiles = file.testFiles.join("; ");
    csv.push(
      `"${file.relativePath}","${file.directory}","${file.category}","${file.risk}",${file.lines},${file.hasTest},"${testFiles}"`,
    );
  }

  return csv.join("\n");
}

// Main execution
console.log("🔍 Analyzing test coverage...\n");

const report = analyzeCodebase();
const markdown = generateMarkdownReport(report);
const csv = generateCSVReport(report);

// Write reports
writeFileSync("COVERAGE_ANALYSIS.md", markdown);
writeFileSync("coverage-analysis.csv", csv);
writeFileSync("coverage-analysis.json", JSON.stringify(report, null, 2));

console.log("✅ Coverage analysis complete!\n");
console.log("📄 Reports generated:");
console.log("  - COVERAGE_ANALYSIS.md (detailed markdown report)");
console.log("  - coverage-analysis.csv (spreadsheet format)");
console.log("  - coverage-analysis.json (machine-readable data)");
console.log("");
console.log("📊 Summary:");
console.log(`  - Total files: ${report.summary.totalFiles}`);
console.log(`  - Files with tests: ${report.summary.testedFiles}`);
console.log(`  - Files without tests: ${report.summary.untestedFiles}`);
console.log(`  - Overall coverage: ${report.summary.overallCoverage}%`);
console.log(`  - Critical gaps: ${report.criticalGaps.length}`);
console.log("");

if (report.recommendations.length > 0) {
  console.log("⚠️  Key recommendations:");
  for (const rec of report.recommendations) {
    console.log(`  - ${rec}`);
  }
}
