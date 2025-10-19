#!/usr/bin/env tsx
/**
 * Load Testing Script for Shuffle & Sync
 * Tests application performance under expected normal load
 *
 * Usage: npm run test:load
 */

import { performance } from "perf_hooks";

interface LoadTestConfig {
  baseUrl: string;
  duration: number; // seconds
  concurrentUsers: number;
  requestsPerUser: number;
  endpoints: string[];
}

interface TestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: Array<{ status: number; message: string }>;
}

const config: LoadTestConfig = {
  baseUrl: process.env.TEST_URL || "http://localhost:3000",
  duration: parseInt(process.env.LOAD_TEST_DURATION || "60"), // 1 minute
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS || "50"),
  requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || "100"),
  endpoints: [
    "/api/health",
    "/api/communities",
    "/api/events",
    "/api/tournaments",
  ],
};

class LoadTester {
  private results: Map<string, number[]> = new Map();
  private errors: Map<string, Array<{ status: number; message: string }>> =
    new Map();
  private startTime: number = 0;
  private endTime: number = 0;

  async runTest(): Promise<void> {
    console.log("🚀 Starting Load Test");
    console.log("=".repeat(60));
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Duration: ${config.duration}s`);
    console.log(`Concurrent Users: ${config.concurrentUsers}`);
    console.log(`Requests per User: ${config.requestsPerUser}`);
    console.log(`Endpoints: ${config.endpoints.join(", ")}`);
    console.log("=".repeat(60));
    console.log("");

    this.startTime = Date.now();

    // Run concurrent user simulations
    const userPromises: Promise<void>[] = [];
    for (let i = 0; i < config.concurrentUsers; i++) {
      userPromises.push(this.simulateUser(i));
    }

    await Promise.all(userPromises);
    this.endTime = Date.now();

    this.printResults();
  }

  private async simulateUser(userId: number): Promise<void> {
    const requests = config.requestsPerUser;

    for (let i = 0; i < requests; i++) {
      // Random endpoint selection
      const endpoint =
        config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
      await this.makeRequest(endpoint);

      // Small delay between requests (100-500ms)
      await this.sleep(100 + Math.random() * 400);
    }
  }

  private async makeRequest(endpoint: string): Promise<void> {
    const url = `${config.baseUrl}${endpoint}`;
    const start = performance.now();

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      const duration = performance.now() - start;

      if (!this.results.has(endpoint)) {
        this.results.set(endpoint, []);
        this.errors.set(endpoint, []);
      }

      this.results.get(endpoint)!.push(duration);

      if (!response.ok) {
        this.errors.get(endpoint)!.push({
          status: response.status,
          message: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      const duration = performance.now() - start;

      if (!this.results.has(endpoint)) {
        this.results.set(endpoint, []);
        this.errors.set(endpoint, []);
      }

      this.results.get(endpoint)!.push(duration);
      this.errors.get(endpoint)!.push({
        status: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private printResults(): void {
    const totalDuration = (this.endTime - this.startTime) / 1000;

    console.log("\n📊 Load Test Results");
    console.log("=".repeat(60));
    console.log(`Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log("");

    const allResults: TestResult[] = [];

    this.results.forEach((times, endpoint) => {
      const errors = this.errors.get(endpoint) || [];
      const totalRequests = times.length;
      const successfulRequests = totalRequests - errors.length;
      const failedRequests = errors.length;

      const result: TestResult = {
        endpoint,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
        minResponseTime: Math.min(...times),
        maxResponseTime: Math.max(...times),
        p95ResponseTime: this.calculatePercentile(times, 95),
        p99ResponseTime: this.calculatePercentile(times, 99),
        requestsPerSecond: totalRequests / totalDuration,
        errors: errors.slice(0, 5), // Show first 5 errors
      };

      allResults.push(result);
    });

    // Print per-endpoint results
    allResults.forEach((result) => {
      console.log(`Endpoint: ${result.endpoint}`);
      console.log(`  Total Requests: ${result.totalRequests}`);
      console.log(
        `  Success: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)`,
      );
      console.log(
        `  Failed: ${result.failedRequests} (${((result.failedRequests / result.totalRequests) * 100).toFixed(2)}%)`,
      );
      console.log(
        `  Avg Response Time: ${result.averageResponseTime.toFixed(2)}ms`,
      );
      console.log(`  Min: ${result.minResponseTime.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxResponseTime.toFixed(2)}ms`);
      console.log(`  P95: ${result.p95ResponseTime.toFixed(2)}ms`);
      console.log(`  P99: ${result.p99ResponseTime.toFixed(2)}ms`);
      console.log(`  Throughput: ${result.requestsPerSecond.toFixed(2)} req/s`);

      if (result.errors.length > 0) {
        console.log(`  Errors (showing first 5):`);
        result.errors.forEach((error) => {
          console.log(`    - ${error.message}`);
        });
      }
      console.log("");
    });

    // Overall summary
    const totalRequests = allResults.reduce(
      (sum, r) => sum + r.totalRequests,
      0,
    );
    const totalSuccess = allResults.reduce(
      (sum, r) => sum + r.successfulRequests,
      0,
    );
    const totalFailed = allResults.reduce(
      (sum, r) => sum + r.failedRequests,
      0,
    );
    const overallAvgTime =
      allResults.reduce(
        (sum, r) => sum + r.averageResponseTime * r.totalRequests,
        0,
      ) / totalRequests;

    console.log("Overall Summary");
    console.log("=".repeat(60));
    console.log(`Total Requests: ${totalRequests}`);
    console.log(
      `Success Rate: ${((totalSuccess / totalRequests) * 100).toFixed(2)}%`,
    );
    console.log(
      `Failure Rate: ${((totalFailed / totalRequests) * 100).toFixed(2)}%`,
    );
    console.log(`Average Response Time: ${overallAvgTime.toFixed(2)}ms`);
    console.log(
      `Overall Throughput: ${(totalRequests / totalDuration).toFixed(2)} req/s`,
    );
    console.log("=".repeat(60));

    // Pass/fail determination
    const successRate = (totalSuccess / totalRequests) * 100;
    const avgResponseTimeAcceptable = overallAvgTime < 500; // 500ms threshold
    const testPassed = successRate >= 95 && avgResponseTimeAcceptable;

    if (testPassed) {
      console.log("\n✅ Load test PASSED");
    } else {
      console.log("\n❌ Load test FAILED");
      if (successRate < 95) {
        console.log(
          `  - Success rate ${successRate.toFixed(2)}% is below 95% threshold`,
        );
      }
      if (!avgResponseTimeAcceptable) {
        console.log(
          `  - Average response time ${overallAvgTime.toFixed(2)}ms exceeds 500ms threshold`,
        );
      }
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new LoadTester();
  tester.runTest().catch((error) => {
    console.error("Load test failed:", error);
    process.exit(1);
  });
}

export { LoadTester, LoadTestConfig, TestResult };
