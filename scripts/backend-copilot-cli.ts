#!/usr/bin/env tsx
/**
 * Backend Copilot Agent CLI
 *
 * Command-line interface for running the Backend Copilot Agent
 * to analyze the Shuffle & Sync backend codebase.
 */

import {
  generateBackendReport,
  runBackendAnalysis,
} from "../server/agents/backend-copilot-agent";
import { runAutomatedFixes } from "../server/agents/automated-fixes";
import { logger } from "../server/logger";
import path from "path";

const REPORT_PATH = path.join(process.cwd(), "BACKEND_COPILOT_ANALYSIS.md");

async function main() {
  try {
    const args = process.argv.slice(2);
    const shouldAutoFix = args.includes("--fix");

    console.log("🤖 Starting Backend Copilot Agent Analysis...\n");

    // Run the analysis
    const result = await runBackendAnalysis({
      projectRoot: process.cwd(),
      enableAutoFix: false, // We'll handle fixes separately
      enableSecurityScanning: true,
      enablePerformanceAnalysis: true,
    });

    // Display summary in console
    console.log(result.summary);
    console.log("\n📊 Recommendations:");
    result.recommendations.forEach((rec) => {
      console.log(`  ${rec}`);
    });

    // Run automated fixes if requested
    if (shouldAutoFix) {
      console.log("\n🔧 Running automated fixes...");
      const fixResults = await runAutomatedFixes(result.issues, process.cwd());

      fixResults.forEach((fixResult, index) => {
        const status = fixResult.success ? "✅" : "❌";
        console.log(`  ${status} ${fixResult.message}`);
      });

      // Re-run analysis after fixes
      console.log("\n🔄 Re-analyzing after fixes...");
      const updatedResult = await runBackendAnalysis({
        projectRoot: process.cwd(),
        enableAutoFix: false,
        enableSecurityScanning: true,
        enablePerformanceAnalysis: true,
      });

      console.log(
        `\n📈 Improvement: ${result.totalIssues} → ${updatedResult.totalIssues} issues`,
      );

      // Generate report with updated results
      await generateBackendReport(REPORT_PATH, {
        projectRoot: process.cwd(),
        enableAutoFix: false,
        enableSecurityScanning: true,
        enablePerformanceAnalysis: true,
      });
    } else {
      // Generate detailed report
      await generateBackendReport(REPORT_PATH, {
        projectRoot: process.cwd(),
        enableAutoFix: false,
        enableSecurityScanning: true,
        enablePerformanceAnalysis: true,
      });
    }

    console.log(`\n📄 Detailed report generated: ${REPORT_PATH}`);
    console.log("\n💡 Run with --fix flag to apply automated fixes");

    // Exit with error code if there are errors
    const errorCount = result.issues.filter(
      (i) => i.severity === "error",
    ).length;
    if (errorCount > 0) {
      console.log(`\n❌ Found ${errorCount} errors that need to be fixed.`);
      process.exit(1);
    } else {
      console.log("\n✅ No critical errors found!");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Backend Copilot Agent failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
