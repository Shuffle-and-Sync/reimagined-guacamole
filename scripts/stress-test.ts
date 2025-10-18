#!/usr/bin/env tsx
/**
 * Stress Testing Script for Shuffle & Sync
 * Tests application performance beyond expected load to find breaking points
 * 
 * Usage: npm run test:stress
 */

import { performance } from 'perf_hooks';

interface StressTestConfig {
  baseUrl: string;
  duration: number; // seconds
  startUsers: number;
  maxUsers: number;
  userIncrement: number;
  incrementInterval: number; // seconds
  endpoints: string[];
}

interface StressPhaseResult {
  phase: number;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

const config: StressTestConfig = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  duration: parseInt(process.env.STRESS_TEST_DURATION || '300'), // 5 minutes
  startUsers: parseInt(process.env.START_USERS || '10'),
  maxUsers: parseInt(process.env.MAX_USERS || '200'),
  userIncrement: parseInt(process.env.USER_INCREMENT || '10'),
  incrementInterval: parseInt(process.env.INCREMENT_INTERVAL || '30'), // 30 seconds
  endpoints: [
    '/api/health',
    '/api/communities',
    '/api/events',
    '/api/tournaments',
    '/api/users/me',
  ],
};

class StressTester {
  private results: number[] = [];
  private errors: Array<{ phase: number; status: number; message: string }> = [];
  private phaseResults: StressPhaseResult[] = [];
  private currentPhase: number = 0;
  private activeUsers: number = 0;
  private isRunning: boolean = false;
  private startTime: number = 0;

  async runTest(): Promise<void> {
    console.log('💪 Starting Stress Test');
    console.log('='.repeat(60));
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Duration: ${config.duration}s`);
    console.log(`Users: ${config.startUsers} → ${config.maxUsers} (increment by ${config.userIncrement} every ${config.incrementInterval}s)`);
    console.log(`Endpoints: ${config.endpoints.join(', ')}`);
    console.log('='.repeat(60));
    console.log('');

    this.startTime = Date.now();
    this.isRunning = true;

    // Start with initial users
    this.activeUsers = config.startUsers;
    this.currentPhase = 0;

    const testPromise = this.runPhases();
    const monitorPromise = this.monitorProgress();

    await Promise.race([testPromise, monitorPromise]);
    this.isRunning = false;

    this.printResults();
  }

  private async runPhases(): Promise<void> {
    const testDuration = config.duration * 1000; // Convert to ms
    const phaseInterval = config.incrementInterval * 1000;
    let elapsed = 0;

    while (elapsed < testDuration && this.activeUsers <= config.maxUsers) {
      const phaseStart = Date.now();
      const phaseResults: number[] = [];
      const phaseErrors: typeof this.errors = [];

      console.log(`\n📈 Phase ${this.currentPhase + 1}: ${this.activeUsers} concurrent users`);

      // Start user simulations for this phase
      const userPromises: Promise<void>[] = [];
      for (let i = 0; i < this.activeUsers; i++) {
        userPromises.push(this.simulateUser(phaseResults, phaseErrors));
      }

      // Wait for phase interval or all users to complete
      await Promise.race([
        Promise.all(userPromises),
        this.sleep(phaseInterval)
      ]);

      const phaseDuration = (Date.now() - phaseStart) / 1000;

      // Calculate phase metrics
      if (phaseResults.length > 0) {
        const phaseResult: StressPhaseResult = {
          phase: this.currentPhase + 1,
          concurrentUsers: this.activeUsers,
          totalRequests: phaseResults.length,
          successfulRequests: phaseResults.length - phaseErrors.length,
          failedRequests: phaseErrors.length,
          averageResponseTime: phaseResults.reduce((a, b) => a + b, 0) / phaseResults.length,
          p95ResponseTime: this.calculatePercentile(phaseResults, 95),
          requestsPerSecond: phaseResults.length / phaseDuration,
          errorRate: (phaseErrors.length / phaseResults.length) * 100,
        };

        this.phaseResults.push(phaseResult);

        console.log(`  Requests: ${phaseResult.totalRequests} (${phaseResult.successfulRequests} success, ${phaseResult.failedRequests} failed)`);
        console.log(`  Avg Response: ${phaseResult.averageResponseTime.toFixed(2)}ms`);
        console.log(`  P95 Response: ${phaseResult.p95ResponseTime.toFixed(2)}ms`);
        console.log(`  Error Rate: ${phaseResult.errorRate.toFixed(2)}%`);
        console.log(`  Throughput: ${phaseResult.requestsPerSecond.toFixed(2)} req/s`);
      }

      // Increment users for next phase
      this.activeUsers += config.userIncrement;
      this.currentPhase++;
      elapsed += phaseInterval;

      // Store errors from this phase
      this.errors.push(...phaseErrors);
      this.results.push(...phaseResults);
    }
  }

  private async monitorProgress(): Promise<void> {
    while (this.isRunning) {
      await this.sleep(5000); // Check every 5 seconds
      
      const elapsed = (Date.now() - this.startTime) / 1000;
      const progress = (elapsed / config.duration) * 100;
      
      if (progress < 100) {
        process.stdout.write(`\rProgress: ${progress.toFixed(1)}% | Users: ${this.activeUsers} | Requests: ${this.results.length}`);
      }
    }
  }

  private async simulateUser(phaseResults: number[], phaseErrors: typeof this.errors): Promise<void> {
    const requestsPerUser = 20; // Each user makes 20 requests during their phase
    
    for (let i = 0; i < requestsPerUser; i++) {
      // Random endpoint selection
      const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
      await this.makeRequest(endpoint, phaseResults, phaseErrors);
      
      // Small delay between requests (50-200ms)
      await this.sleep(50 + Math.random() * 150);
    }
  }

  private async makeRequest(
    endpoint: string,
    phaseResults: number[],
    phaseErrors: typeof this.errors
  ): Promise<void> {
    const url = `${config.baseUrl}${endpoint}`;
    const start = performance.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const duration = performance.now() - start;
      phaseResults.push(duration);
      
      if (!response.ok) {
        phaseErrors.push({
          phase: this.currentPhase,
          status: response.status,
          message: `HTTP ${response.status} - ${endpoint}`,
        });
      }
    } catch (error) {
      const duration = performance.now() - start;
      phaseResults.push(duration);
      
      phaseErrors.push({
        phase: this.currentPhase,
        status: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private printResults(): void {
    console.log('\n\n📊 Stress Test Results');
    console.log('='.repeat(60));

    if (this.phaseResults.length === 0) {
      console.log('No results collected');
      return;
    }

    // Print phase-by-phase breakdown
    console.log('\nPhase Breakdown:');
    console.log('-'.repeat(60));
    this.phaseResults.forEach(phase => {
      console.log(`Phase ${phase.phase} (${phase.concurrentUsers} users):`);
      console.log(`  Success Rate: ${((phase.successfulRequests / phase.totalRequests) * 100).toFixed(2)}%`);
      console.log(`  Avg Response: ${phase.averageResponseTime.toFixed(2)}ms`);
      console.log(`  P95 Response: ${phase.p95ResponseTime.toFixed(2)}ms`);
      console.log(`  Throughput: ${phase.requestsPerSecond.toFixed(2)} req/s`);
      console.log(`  Error Rate: ${phase.errorRate.toFixed(2)}%`);
      console.log('');
    });

    // Overall summary
    const totalRequests = this.results.length;
    const totalSuccess = totalRequests - this.errors.length;
    const successRate = (totalSuccess / totalRequests) * 100;
    const avgResponseTime = this.results.reduce((a, b) => a + b, 0) / totalRequests;

    console.log('Overall Summary:');
    console.log('='.repeat(60));
    console.log(`Total Phases: ${this.phaseResults.length}`);
    console.log(`Max Concurrent Users: ${Math.max(...this.phaseResults.map(p => p.concurrentUsers))}`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`P95 Response Time: ${this.calculatePercentile(this.results, 95).toFixed(2)}ms`);
    console.log(`P99 Response Time: ${this.calculatePercentile(this.results, 99).toFixed(2)}ms`);

    // Find breaking point
    const breakingPhase = this.phaseResults.find(p => p.errorRate > 5 || p.averageResponseTime > 2000);
    
    if (breakingPhase) {
      console.log(`\n⚠️  Breaking point detected at Phase ${breakingPhase.phase} (${breakingPhase.concurrentUsers} users)`);
      console.log(`  Error Rate: ${breakingPhase.errorRate.toFixed(2)}%`);
      console.log(`  Avg Response Time: ${breakingPhase.averageResponseTime.toFixed(2)}ms`);
    } else {
      console.log(`\n✅ No breaking point detected up to ${this.activeUsers} concurrent users`);
    }

    // Show sample errors
    if (this.errors.length > 0) {
      console.log(`\nSample Errors (first 10):`);
      this.errors.slice(0, 10).forEach(error => {
        console.log(`  Phase ${error.phase}: ${error.message}`);
      });
    }

    console.log('='.repeat(60));

    // Test verdict
    const testPassed = successRate >= 90 && avgResponseTime < 1000;
    if (testPassed) {
      console.log('\n✅ Stress test PASSED - System handles load well');
    } else {
      console.log('\n❌ Stress test FAILED - System shows degradation under load');
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new StressTester();
  tester.runTest().catch(error => {
    console.error('Stress test failed:', error);
    process.exit(1);
  });
}

export { StressTester, StressTestConfig, StressPhaseResult };
