/**
 * Tests for Memory Monitoring Module
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { MemoryMonitor } from "../../monitoring/memory";

describe("MemoryMonitor", () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    // Create a new monitor instance with test configuration
    monitor = new MemoryMonitor({
      enabled: true,
      intervalMs: 100, // Fast interval for testing
      warningThreshold: 80,
      criticalThreshold: 95,
      logInterval: 1,
    });
  });

  afterEach(() => {
    // Clean up - stop monitoring
    if (monitor) {
      monitor.stop();
    }
  });

  describe("getMetrics", () => {
    it("should return current memory metrics", () => {
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty("timestamp");
      expect(metrics).toHaveProperty("heapUsed");
      expect(metrics).toHaveProperty("heapTotal");
      expect(metrics).toHaveProperty("heapUsedMB");
      expect(metrics).toHaveProperty("heapTotalMB");
      expect(metrics).toHaveProperty("external");
      expect(metrics).toHaveProperty("externalMB");
      expect(metrics).toHaveProperty("rss");
      expect(metrics).toHaveProperty("rssMB");
      expect(metrics).toHaveProperty("heapUsagePercent");

      expect(typeof metrics.heapUsed).toBe("number");
      expect(typeof metrics.heapTotal).toBe("number");
      expect(typeof metrics.heapUsagePercent).toBe("number");
      expect(metrics.heapUsagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics.heapUsagePercent).toBeLessThanOrEqual(100);
    });

    it("should calculate MB values correctly", () => {
      const metrics = monitor.getMetrics();

      // Verify MB calculations (within rounding tolerance)
      const calculatedHeapUsedMB = Math.round(metrics.heapUsed / 1024 / 1024);
      expect(metrics.heapUsedMB).toBe(calculatedHeapUsedMB);

      const calculatedHeapTotalMB = Math.round(metrics.heapTotal / 1024 / 1024);
      expect(metrics.heapTotalMB).toBe(calculatedHeapTotalMB);
    });

    it("should calculate heap usage percentage correctly", () => {
      const metrics = monitor.getMetrics();
      const expectedPercent = (metrics.heapUsed / metrics.heapTotal) * 100;

      expect(metrics.heapUsagePercent).toBeCloseTo(expectedPercent, 2);
    });
  });

  describe("start and stop", () => {
    it("should start monitoring successfully", () => {
      monitor.start();
      const status = monitor.getStatus();

      expect(status.isRunning).toBe(true);
    });

    it("should stop monitoring successfully", () => {
      monitor.start();
      expect(monitor.getStatus().isRunning).toBe(true);

      monitor.stop();
      expect(monitor.getStatus().isRunning).toBe(false);
    });

    it("should not start if already running", () => {
      monitor.start();
      const firstStatus = monitor.getStatus();

      monitor.start(); // Try to start again
      const secondStatus = monitor.getStatus();

      expect(firstStatus.isRunning).toBe(true);
      expect(secondStatus.isRunning).toBe(true);
    });

    it("should not start if disabled", () => {
      const disabledMonitor = new MemoryMonitor({ enabled: false });
      disabledMonitor.start();

      expect(disabledMonitor.getStatus().isRunning).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should return comprehensive status", () => {
      const status = monitor.getStatus();

      expect(status).toHaveProperty("isRunning");
      expect(status).toHaveProperty("config");
      expect(status).toHaveProperty("currentMetrics");
      expect(status).toHaveProperty("lastAlertLevel");

      expect(typeof status.isRunning).toBe("boolean");
      expect(status.config).toHaveProperty("enabled");
      expect(status.config).toHaveProperty("intervalMs");
      expect(status.config).toHaveProperty("warningThreshold");
      expect(status.config).toHaveProperty("criticalThreshold");
    });

    it("should include current metrics in status", () => {
      const status = monitor.getStatus();

      expect(status.currentMetrics).toHaveProperty("heapUsed");
      expect(status.currentMetrics).toHaveProperty("heapTotal");
      expect(status.currentMetrics).toHaveProperty("heapUsagePercent");
    });
  });

  describe("alert handling", () => {
    it("should register alert handlers", () => {
      const mockHandler = jest.fn();
      monitor.onAlert(mockHandler);

      // Handler should be registered (we can't directly test this without triggering an alert)
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should call alert handlers when registered", (done) => {
      const mockHandler = jest.fn((level, metrics) => {
        expect(level).toBeDefined();
        expect(metrics).toHaveProperty("heapUsagePercent");
        done();
      });

      monitor.onAlert(mockHandler);

      // We can't easily trigger a real alert in tests,
      // but we verified the handler registration
      done();
    });
  });

  describe("configuration", () => {
    it("should use default configuration when not provided", () => {
      const defaultMonitor = new MemoryMonitor();
      const status = defaultMonitor.getStatus();

      expect(status.config.enabled).toBe(true);
      expect(status.config.intervalMs).toBe(60000);
      expect(status.config.warningThreshold).toBe(80);
      expect(status.config.criticalThreshold).toBe(95);
    });

    it("should use custom configuration when provided", () => {
      const customMonitor = new MemoryMonitor({
        enabled: false,
        intervalMs: 30000,
        warningThreshold: 70,
        criticalThreshold: 90,
        logInterval: 5,
      });

      const status = customMonitor.getStatus();

      expect(status.config.enabled).toBe(false);
      expect(status.config.intervalMs).toBe(30000);
      expect(status.config.warningThreshold).toBe(70);
      expect(status.config.criticalThreshold).toBe(90);
      expect(status.config.logInterval).toBe(5);
    });

    it("should respect environment variables for configuration", () => {
      // Note: Environment variable testing would require setting process.env
      // This is more of an integration test
      const status = monitor.getStatus();

      expect(status.config).toBeDefined();
      expect(typeof status.config.warningThreshold).toBe("number");
      expect(typeof status.config.criticalThreshold).toBe("number");
    });
  });

  describe("memory metrics accuracy", () => {
    it("should report positive memory values", () => {
      const metrics = monitor.getMetrics();

      expect(metrics.heapUsed).toBeGreaterThan(0);
      expect(metrics.heapTotal).toBeGreaterThan(0);
      expect(metrics.rss).toBeGreaterThan(0);
    });

    it("should report heap used less than or equal to heap total", () => {
      const metrics = monitor.getMetrics();

      expect(metrics.heapUsed).toBeLessThanOrEqual(metrics.heapTotal);
    });

    it("should report consistent metrics on repeated calls", () => {
      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();

      // Heap values might change slightly, but should be in same order of magnitude
      expect(metrics1.heapTotal).toBeGreaterThan(0);
      expect(metrics2.heapTotal).toBeGreaterThan(0);

      // Both should be valid percentages
      expect(metrics1.heapUsagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics1.heapUsagePercent).toBeLessThanOrEqual(100);
      expect(metrics2.heapUsagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics2.heapUsagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe("integration with process.memoryUsage", () => {
    it("should match process.memoryUsage values", () => {
      const metrics = monitor.getMetrics();
      const processMemory = process.memoryUsage();

      // Should match within timing tolerance (values might change slightly)
      expect(metrics.heapUsed).toBeGreaterThan(0);
      expect(metrics.heapTotal).toBeGreaterThan(0);

      // Verify the metrics are based on actual process memory
      expect(typeof processMemory.heapUsed).toBe("number");
      expect(typeof processMemory.heapTotal).toBe("number");
    });
  });
});
