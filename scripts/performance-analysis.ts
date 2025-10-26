#!/usr/bin/env tsx

/**
 * Comprehensive Performance Analysis Tool
 * Analyzes frontend and backend performance metrics
 */

/* eslint-disable no-console */

import { exec } from "child_process";
import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

interface BundleAnalysis {
  file: string;
  size: number;
  gzipSize: number;
}

interface DependencyAnalysis {
  total: number;
  unused: string[];
  devDependencies: number;
  productionDependencies: number;
}

interface DatabaseQueryAnalysis {
  totalQueries: number;
  filesWithQueries: number;
  potentialNPlusOne: string[];
}

interface CacheAnalysis {
  cacheServiceExists: boolean;
  cacheTTLs: Record<string, number>;
  cacheUsage: string[];
}

interface WebSocketAnalysis {
  webSocketFiles: string[];
  maxPayloadSize: string | null;
  rateLimitingEnabled: boolean;
}

interface PerformanceReport {
  timestamp: string;
  frontend: {
    bundles: BundleAnalysis[];
    totalSize: number;
    totalGzipSize: number;
    largestBundles: BundleAnalysis[];
    chunkingStrategy: string;
  };
  dependencies: DependencyAnalysis;
  backend: {
    apiEndpointCount: number;
    databaseQueries: DatabaseQueryAnalysis;
    cache: CacheAnalysis;
    webSocket: WebSocketAnalysis;
  };
  recommendations: string[];
}

class PerformanceAnalyzer {
  private projectRoot: string;
  private distPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.distPath = join(this.projectRoot, "dist", "public", "assets", "js");
  }

  async analyze(): Promise<PerformanceReport> {
    console.log("🔍 Starting comprehensive performance analysis...\n");

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      frontend: await this.analyzeFrontend(),
      dependencies: await this.analyzeDependencies(),
      backend: await this.analyzeBackend(),
      recommendations: [],
    };

    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  private async analyzeFrontend() {
    console.log("📦 Analyzing frontend bundles...");

    if (!existsSync(this.distPath)) {
      console.warn("⚠️  Build artifacts not found. Run 'npm run build' first.");
      return {
        bundles: [],
        totalSize: 0,
        totalGzipSize: 0,
        largestBundles: [],
        chunkingStrategy: "unknown",
      };
    }

    const bundles: BundleAnalysis[] = [];
    const files = readdirSync(this.distPath);

    for (const file of files) {
      if (file.endsWith(".js")) {
        const filePath = join(this.distPath, file);
        const stats = statSync(filePath);
        const size = stats.size;

        // Estimate gzip size (typically 70-80% reduction)
        const gzipSize = Math.round(size * 0.3);

        bundles.push({
          file,
          size,
          gzipSize,
        });
      }
    }

    bundles.sort((a, b) => b.size - a.size);

    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);

    // Check vite.config.ts for chunking strategy
    const viteConfigPath = join(this.projectRoot, "vite.config.ts");
    let chunkingStrategy = "default";
    if (existsSync(viteConfigPath)) {
      const viteConfig = readFileSync(viteConfigPath, "utf-8");
      if (viteConfig.includes("manualChunks")) {
        chunkingStrategy = "manual chunks configured";
      }
    }

    return {
      bundles,
      totalSize,
      totalGzipSize,
      largestBundles: bundles.slice(0, 5),
      chunkingStrategy,
    };
  }

  private async analyzeDependencies(): Promise<DependencyAnalysis> {
    console.log("📚 Analyzing dependencies...");

    const packageJsonPath = join(this.projectRoot, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    // Run depcheck to find unused dependencies
    let unused: string[] = [];
    try {
      const { stdout } = await execAsync(
        'npx depcheck --ignores="@types/*,eslint-*,@eslint/*,prettier,husky,ts-jest,tsx,@testing-library/*,@vitest/*,@storybook/*,happy-dom,jsdom,msw,vitest,jest,@jest/*,drizzle-kit,autoprefixer,postcss,tailwindcss,typescript,esbuild,vite,@vitejs/*" --json',
        { cwd: this.projectRoot },
      );
      const depcheckResult = JSON.parse(stdout);
      unused = depcheckResult.dependencies || [];
    } catch {
      // Depcheck not available
    }

    return {
      total: Object.keys(deps).length + Object.keys(devDeps).length,
      unused,
      devDependencies: Object.keys(devDeps).length,
      productionDependencies: Object.keys(deps).length,
    };
  }

  private async analyzeBackend() {
    console.log("🔧 Analyzing backend performance...");

    return {
      apiEndpointCount: await this.countApiEndpoints(),
      databaseQueries: await this.analyzeDatabaseQueries(),
      cache: await this.analyzeCaching(),
      webSocket: await this.analyzeWebSocket(),
    };
  }

  private async countApiEndpoints(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        'grep -r "app\\.\\(get\\|post\\|put\\|delete\\|patch\\)" server --include="*.ts" | grep -v test | wc -l',
        { cwd: this.projectRoot },
      );
      return parseInt(stdout.trim(), 10);
    } catch {
      return 0;
    }
  }

  private async analyzeDatabaseQueries(): Promise<DatabaseQueryAnalysis> {
    try {
      const { stdout: queriesOutput } = await execAsync(
        'grep -r "db\\.\\(select\\|insert\\|update\\|delete\\)" server --include="*.ts" | grep -v test | wc -l',
        { cwd: this.projectRoot },
      );

      const { stdout: filesOutput } = await execAsync(
        'grep -rl "db\\.\\(select\\|insert\\|update\\|delete\\)" server --include="*.ts" | grep -v test | wc -l',
        { cwd: this.projectRoot },
      );

      // Find potential N+1 queries (loops with database queries)
      const potentialNPlusOne: string[] = [];
      const { stdout: loopQueries } = await execAsync(
        'grep -B 5 "db\\.select\\|db\\.query" server --include="*.ts" | grep -E "(for|forEach|map)" || true',
        { cwd: this.projectRoot },
      );

      if (loopQueries.trim()) {
        potentialNPlusOne.push("Potential N+1 queries detected in loops");
      }

      return {
        totalQueries: parseInt(queriesOutput.trim(), 10),
        filesWithQueries: parseInt(filesOutput.trim(), 10),
        potentialNPlusOne,
      };
    } catch {
      return {
        totalQueries: 0,
        filesWithQueries: 0,
        potentialNPlusOne: [],
      };
    }
  }

  private async analyzeCaching(): Promise<CacheAnalysis> {
    const cacheServicePath = join(
      this.projectRoot,
      "server",
      "services",
      "cache-service.ts",
    );

    if (!existsSync(cacheServicePath)) {
      return {
        cacheServiceExists: false,
        cacheTTLs: {},
        cacheUsage: [],
      };
    }

    const cacheService = readFileSync(cacheServicePath, "utf-8");

    // Extract TTL values
    const ttlMatches = cacheService.matchAll(/(\w+TTL)\s*=\s*(\d+)/g);
    const cacheTTLs: Record<string, number> = {};
    for (const match of ttlMatches) {
      cacheTTLs[match[1]] = parseInt(match[2], 10);
    }

    // Find cache usage patterns
    const cacheUsage: string[] = [];
    if (cacheService.includes("cacheUser")) cacheUsage.push("User caching");
    if (cacheService.includes("cacheCommunity"))
      cacheUsage.push("Community caching");
    if (cacheService.includes("cacheStreamSession"))
      cacheUsage.push("Stream session caching");
    if (cacheService.includes("cacheApiResponse"))
      cacheUsage.push("API response caching");
    if (cacheService.includes("cacheAnalyticsData"))
      cacheUsage.push("Analytics caching");

    return {
      cacheServiceExists: true,
      cacheTTLs,
      cacheUsage,
    };
  }

  private async analyzeWebSocket(): Promise<WebSocketAnalysis> {
    const wsServerPath = join(
      this.projectRoot,
      "server",
      "utils",
      "websocket-server-enhanced.ts",
    );

    const webSocketFiles: string[] = [];
    try {
      const { stdout } = await execAsync(
        'find server -name "*.ts" -exec grep -l "WebSocket\\|ws\\|socket" {} \\; | head -10',
        { cwd: this.projectRoot },
      );
      webSocketFiles.push(...stdout.trim().split("\n").filter(Boolean));
    } catch {
      // Ignore errors finding WebSocket files
    }

    let maxPayloadSize: string | null = null;
    let rateLimitingEnabled = false;

    if (existsSync(wsServerPath)) {
      const wsServer = readFileSync(wsServerPath, "utf-8");
      const payloadMatch = wsServer.match(/maxPayload:\s*(.+)/);
      if (payloadMatch) {
        maxPayloadSize = payloadMatch[1].trim();
      }

      if (wsServer.includes("rateLimiter") || wsServer.includes("rate-limit")) {
        rateLimitingEnabled = true;
      }
    }

    return {
      webSocketFiles,
      maxPayloadSize,
      rateLimitingEnabled,
    };
  }

  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];

    // Frontend recommendations
    if (report.frontend.totalSize > 1024 * 1024) {
      // 1MB threshold
      recommendations.push(
        `⚠️  Frontend bundle size (${Math.round(report.frontend.totalSize / 1024)}KB) exceeds 1MB. Consider code splitting or lazy loading.`,
      );
    }

    if (report.frontend.largestBundles.length > 0) {
      const largest = report.frontend.largestBundles[0];
      if (largest.size > 200 * 1024) {
        // 200KB threshold
        recommendations.push(
          `⚠️  Largest bundle ${largest.file} is ${Math.round(largest.size / 1024)}KB. Consider splitting this bundle.`,
        );
      }
    }

    // Dependency recommendations
    if (report.dependencies.unused.length > 10) {
      recommendations.push(
        `⚠️  ${report.dependencies.unused.length} unused dependencies detected. Remove them to reduce bundle size.`,
      );
    }

    // Backend recommendations
    if (report.backend.databaseQueries.potentialNPlusOne.length > 0) {
      recommendations.push(
        `⚠️  Potential N+1 queries detected. Review database query patterns and use eager loading.`,
      );
    }

    if (!report.backend.cache.cacheServiceExists) {
      recommendations.push(
        `⚠️  No caching service detected. Implement caching for frequently accessed data.`,
      );
    }

    if (report.backend.cache.cacheUsage.length < 3) {
      recommendations.push(
        `💡 Consider expanding cache usage. Currently: ${report.backend.cache.cacheUsage.join(", ")}`,
      );
    }

    // WebSocket recommendations
    if (!report.backend.webSocket.rateLimitingEnabled) {
      recommendations.push(
        `⚠️  WebSocket rate limiting not detected. Implement to prevent abuse.`,
      );
    }

    // Positive findings
    if (report.frontend.chunkingStrategy.includes("manual")) {
      recommendations.push(
        `✅ Manual chunk splitting configured - good for optimization!`,
      );
    }

    if (report.backend.cache.cacheServiceExists) {
      recommendations.push(
        `✅ Cache service implemented with TTLs: ${Object.keys(report.backend.cache.cacheTTLs).join(", ")}`,
      );
    }

    return recommendations;
  }

  printReport(report: PerformanceReport): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 PERFORMANCE ANALYSIS REPORT");
    console.log("=".repeat(80));
    console.log(`Generated: ${report.timestamp}\n`);

    // Frontend Analysis
    console.log("🎨 FRONTEND ANALYSIS");
    console.log("-".repeat(80));
    console.log(
      `Total Bundle Size: ${Math.round(report.frontend.totalSize / 1024)}KB (${Math.round(report.frontend.totalGzipSize / 1024)}KB gzipped)`,
    );
    console.log(`Chunking Strategy: ${report.frontend.chunkingStrategy}`);
    console.log(`\nTop 5 Largest Bundles:`);
    report.frontend.largestBundles.forEach((bundle, i) => {
      console.log(
        `  ${i + 1}. ${bundle.file}: ${Math.round(bundle.size / 1024)}KB (${Math.round(bundle.gzipSize / 1024)}KB gzipped)`,
      );
    });

    // Dependencies Analysis
    console.log("\n📦 DEPENDENCIES ANALYSIS");
    console.log("-".repeat(80));
    console.log(`Total Dependencies: ${report.dependencies.total}`);
    console.log(`  Production: ${report.dependencies.productionDependencies}`);
    console.log(`  Development: ${report.dependencies.devDependencies}`);
    console.log(`Unused Dependencies: ${report.dependencies.unused.length}`);
    if (report.dependencies.unused.length > 0) {
      console.log(
        `  Examples: ${report.dependencies.unused.slice(0, 5).join(", ")}`,
      );
    }

    // Backend Analysis
    console.log("\n⚙️  BACKEND ANALYSIS");
    console.log("-".repeat(80));
    console.log(`API Endpoints: ${report.backend.apiEndpointCount}`);
    console.log(
      `Database Queries: ${report.backend.databaseQueries.totalQueries} (in ${report.backend.databaseQueries.filesWithQueries} files)`,
    );
    console.log(
      `Cache Service: ${report.backend.cache.cacheServiceExists ? "✅ Enabled" : "❌ Not Found"}`,
    );
    if (report.backend.cache.cacheServiceExists) {
      console.log(
        `  Cache Usage: ${report.backend.cache.cacheUsage.join(", ")}`,
      );
      console.log(
        `  TTL Configuration: ${Object.entries(report.backend.cache.cacheTTLs)
          .map(([k, v]) => `${k}=${v}s`)
          .join(", ")}`,
      );
    }
    console.log(
      `WebSocket Files: ${report.backend.webSocket.webSocketFiles.length}`,
    );
    if (report.backend.webSocket.maxPayloadSize) {
      console.log(
        `  Max Payload Size: ${report.backend.webSocket.maxPayloadSize}`,
      );
    }
    console.log(
      `  Rate Limiting: ${report.backend.webSocket.rateLimitingEnabled ? "✅ Enabled" : "❌ Not Detected"}`,
    );

    // Recommendations
    console.log("\n💡 RECOMMENDATIONS");
    console.log("-".repeat(80));
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    console.log("\n" + "=".repeat(80));
  }

  async saveReport(report: PerformanceReport, filename: string): Promise<void> {
    const { writeFileSync } = await import("fs");
    writeFileSync(filename, JSON.stringify(report, null, 2), "utf-8");
    console.log(`\n📄 Report saved to: ${filename}`);
  }
}

// Main execution
async function main() {
  const analyzer = new PerformanceAnalyzer();
  const report = await analyzer.analyze();
  analyzer.printReport(report);

  // Save detailed report
  await analyzer.saveReport(report, "performance-analysis-report.json");

  console.log("\n✅ Performance analysis complete!");
}

main().catch((error) => {
  console.error("❌ Analysis failed:", error);
  process.exit(1);
});
