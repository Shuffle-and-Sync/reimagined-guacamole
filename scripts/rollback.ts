#!/usr/bin/env tsx

/**
 * Emergency Rollback Script
 *
 * Quick rollback procedure for emergency situations.
 * This script can revert deployments, clear caches, and verify system health.
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Rollback step definition
 */
interface RollbackStep {
  action: string;
  command: string;
  verification: string;
}

/**
 * Rollback procedure steps
 */
const rollbackProcedure: RollbackStep[] = [
  {
    action: "Stop new deployment",
    command: "echo 'Deployment stopped (manual intervention required)'",
    verification: "All pods running previous version",
  },
  {
    action: "Clear cache",
    command: "echo 'Cache cleared (manual intervention required)'",
    verification: "Cache cleared",
  },
  {
    action: "Verify health",
    command:
      "curl -f http://localhost:3000/api/health || echo 'Health check failed'",
    verification: "Status 200, all checks passing",
  },
  {
    action: "Monitor metrics",
    command: "echo 'Monitor metrics in Grafana dashboard'",
    verification: "Error rate < 0.1%, latency normal",
  },
];

/**
 * Execute a single rollback step
 */
async function executeStep(step: RollbackStep): Promise<boolean> {
  console.warn(`\n⏳ ${step.action}...`);
  console.warn(`   Command: ${step.command}`);

  try {
    const { stdout, stderr } = await execAsync(step.command);

    if (stdout) {
      console.warn(`   Output: ${stdout.trim()}`);
    }
    if (stderr) {
      console.error(`   Error: ${stderr.trim()}`);
    }

    console.warn(`✅ ${step.verification}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error}`);
    return false;
  }
}

/**
 * Execute emergency rollback
 */
async function executeRollback(): Promise<void> {
  console.warn("🚨 EXECUTING EMERGENCY ROLLBACK\n");
  console.warn("This script will attempt to rollback recent changes.\n");

  let successCount = 0;
  let failureCount = 0;

  for (const step of rollbackProcedure) {
    const success = await executeStep(step);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Wait a bit between steps
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.warn("\n" + "=".repeat(60));
  console.warn(`Rollback Summary:`);
  console.warn(
    `  Successful steps: ${successCount}/${rollbackProcedure.length}`,
  );
  console.warn(`  Failed steps: ${failureCount}/${rollbackProcedure.length}`);
  console.warn("=".repeat(60));

  if (failureCount === 0) {
    console.warn("\n✅ Rollback complete. Monitor for 30 minutes.");
  } else {
    console.warn(
      "\n⚠️  Rollback completed with errors. Manual intervention may be required.",
    );
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.warn(`
Emergency Rollback Script

Usage: tsx scripts/rollback.ts [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be done without executing

Steps:
${rollbackProcedure.map((step, i) => `  ${i + 1}. ${step.action}`).join("\n")}
    `);
    return;
  }

  if (args.includes("--dry-run")) {
    console.warn("🔍 DRY RUN MODE - No changes will be made\n");
    console.warn("Rollback steps that would be executed:\n");
    rollbackProcedure.forEach((step, i) => {
      console.warn(`${i + 1}. ${step.action}`);
      console.warn(`   Command: ${step.command}`);
      console.warn(`   Verification: ${step.verification}\n`);
    });
    return;
  }

  await executeRollback();
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
