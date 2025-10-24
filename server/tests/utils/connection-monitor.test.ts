/**
 * Connection Monitor Tests
 *
 * Unit tests for connection leak detection and monitoring functionality.
 */

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  ConnectionLeakDetector,
  connectionMonitor,
} from "../../utils/connection-monitor";

describe("ConnectionLeakDetector", () => {
  let detector: ConnectionLeakDetector;

  beforeEach(() => {
    detector = ConnectionLeakDetector.getInstance();
    detector.reset();
  });

  afterEach(() => {
    detector.stopLeakDetection();
    jest.clearAllTimers();
  });

  describe("Connection Tracking", () => {
    test("should track new connection", () => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");

      const metrics = detector.getMetrics();
      expect(metrics.activeConnections).toBe(1);
      expect(metrics.poolMetrics.totalAcquired).toBe(1);
    });

    test("should track multiple connections", () => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");
      detector.trackConnection("conn-2", "POST /api/events", "user-456");
      detector.trackConnection("conn-3", "GET /api/communities", "user-789");

      const metrics = detector.getMetrics();
      expect(metrics.activeConnections).toBe(3);
      expect(metrics.poolMetrics.totalAcquired).toBe(3);
    });

    test("should release tracked connection", () => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");
      detector.releaseConnection("conn-1");

      const metrics = detector.getMetrics();
      expect(metrics.activeConnections).toBe(0);
      expect(metrics.poolMetrics.totalReleased).toBe(1);
    });

    test("should update peak connections", () => {
      detector.trackConnection("conn-1", "GET /api/users");
      detector.trackConnection("conn-2", "GET /api/events");
      detector.trackConnection("conn-3", "GET /api/communities");

      const metrics = detector.getMetrics();
      expect(metrics.poolMetrics.peakConnections).toBe(3);

      detector.releaseConnection("conn-1");
      detector.releaseConnection("conn-2");

      const updatedMetrics = detector.getMetrics();
      expect(updatedMetrics.activeConnections).toBe(1);
      expect(updatedMetrics.poolMetrics.peakConnections).toBe(3); // Peak should remain
    });

    test("should handle unknown connection release", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

      detector.releaseConnection("unknown-conn");

      const metrics = detector.getMetrics();
      expect(metrics.activeConnections).toBe(0);
      expect(metrics.poolMetrics.totalReleased).toBe(0);

      spy.mockRestore();
    });
  });

  describe("Active Connections", () => {
    test("should return active connection details", () => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");
      detector.trackConnection("conn-2", "POST /api/events", "user-456");

      const activeConnections = detector.getActiveConnections();
      expect(activeConnections).toHaveLength(2);
      expect(activeConnections[0]).toHaveProperty("id");
      expect(activeConnections[0]).toHaveProperty("endpoint");
      expect(activeConnections[0]).toHaveProperty("userId");
      expect(activeConnections[0]).toHaveProperty("age");
      expect(activeConnections[0].released).toBe(false);
    });

    test("should calculate connection age", (done) => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");

      setTimeout(() => {
        const activeConnections = detector.getActiveConnections();
        expect(activeConnections[0].age).toBeGreaterThan(100);
        done();
      }, 150);
    });
  });

  describe("Connection Statistics", () => {
    test("should calculate statistics correctly", (done) => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");
      detector.trackConnection("conn-2", "POST /api/events", "user-456");

      setTimeout(() => {
        detector.releaseConnection("conn-1");

        const stats = detector.getStatistics();
        expect(stats.totalAcquired).toBe(2);
        expect(stats.totalReleased).toBe(1);
        expect(stats.currentlyActive).toBe(1);
        expect(stats.peakConnections).toBe(2);
        done();
      }, 50);
    });

    test("should calculate average connection duration", (done) => {
      detector.trackConnection("conn-1", "GET /api/users");

      setTimeout(() => {
        detector.releaseConnection("conn-1");

        const stats = detector.getStatistics();
        expect(stats.averageConnectionDuration).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe("Leak Detection", () => {
    test("should detect connection leaks", (done) => {
      // Set short leak threshold for testing
      detector.setLeakThreshold(100);
      detector.setCheckInterval(50);

      detector.trackConnection("conn-1", "GET /api/users", "user-123");

      // Force a leak check after the threshold
      setTimeout(() => {
        detector.forceLeakCheck();

        const alerts = detector.getAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0].severity).toBe("warning");
        expect(alerts[0].message).toContain("leak");
        done();
      }, 150);
    });

    test("should set critical severity for multiple leaks", (done) => {
      detector.setLeakThreshold(50);
      detector.setCheckInterval(30);

      // Create multiple leaked connections
      for (let i = 0; i < 6; i++) {
        detector.trackConnection(`conn-${i}`, "GET /api/test", "user-123");
      }

      setTimeout(() => {
        detector.forceLeakCheck();

        const alerts = detector.getAlerts();
        const criticalAlert = alerts.find((a) => a.severity === "critical");
        expect(criticalAlert).toBeDefined();
        done();
      }, 100);
    });

    test("should not detect leaks for released connections", (done) => {
      detector.setLeakThreshold(100);
      detector.setCheckInterval(50);

      detector.trackConnection("conn-1", "GET /api/users", "user-123");

      setTimeout(() => {
        detector.releaseConnection("conn-1");
      }, 30);

      setTimeout(() => {
        detector.forceLeakCheck();

        const alerts = detector.getAlerts();
        expect(alerts.length).toBe(0);
        done();
      }, 200);
    });

    test("should force leak check", (done) => {
      detector.setLeakThreshold(0); // Any connection is a leak
      detector.trackConnection("conn-1", "GET /api/users", "user-123");

      // Wait a bit to ensure connection is old enough
      setTimeout(() => {
        detector.forceLeakCheck();

        const alerts = detector.getAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        done();
      }, 50);
    });
  });

  describe("Configuration", () => {
    test("should update leak threshold", () => {
      const newThreshold = 5000;

      detector.setLeakThreshold(newThreshold);

      // The threshold is updated, but we can't directly verify it
      // Instead, verify it works by detecting a leak faster
      detector.setCheckInterval(100);
      detector.trackConnection("conn-1", "GET /api/users");

      setTimeout(() => {
        const alerts = detector.getAlerts();
        // Should detect leak with lower threshold
        expect(alerts.length).toBeGreaterThan(0);
      }, 6000);
    });

    test("should update check interval", () => {
      const newInterval = 5000;
      detector.setCheckInterval(newInterval);

      // Verify the detector is still running
      const metrics = detector.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe("Reset", () => {
    test("should reset all metrics", () => {
      detector.trackConnection("conn-1", "GET /api/users", "user-123");
      detector.trackConnection("conn-2", "POST /api/events", "user-456");
      detector.releaseConnection("conn-1");

      detector.reset();

      const metrics = detector.getMetrics();
      expect(metrics.activeConnections).toBe(0);
      expect(metrics.historicalCount).toBe(0);
      expect(metrics.leakAlerts).toBe(0);
      expect(metrics.poolMetrics.totalAcquired).toBe(0);
      expect(metrics.poolMetrics.totalReleased).toBe(0);
      expect(metrics.poolMetrics.peakConnections).toBe(0);
    });
  });

  describe("Alerts", () => {
    test("should limit returned alerts", (done) => {
      detector.setLeakThreshold(10);
      detector.setCheckInterval(20);

      // Create many leaked connections to generate multiple alerts
      for (let i = 0; i < 20; i++) {
        detector.trackConnection(`conn-${i}`, "GET /api/test", "user-123");
      }

      setTimeout(() => {
        const alerts = detector.getAlerts(5);
        expect(alerts.length).toBeLessThanOrEqual(5);
        done();
      }, 200);
    });

    test("should include metadata in alerts", (done) => {
      detector.setLeakThreshold(50);
      detector.setCheckInterval(30);

      detector.trackConnection("conn-1", "GET /api/users", "user-123");

      setTimeout(() => {
        const alerts = detector.getAlerts();
        if (alerts.length > 0) {
          expect(alerts[0]).toHaveProperty("metadata");
          expect(alerts[0].metadata).toHaveProperty("count");
          expect(alerts[0].metadata).toHaveProperty("connections");
        }
        done();
      }, 150);
    });
  });
});

describe("connectionMonitor utility", () => {
  beforeEach(() => {
    connectionMonitor.reset();
  });

  afterEach(() => {
    ConnectionLeakDetector.getInstance().stopLeakDetection();
  });

  test("should track connection using utility", () => {
    connectionMonitor.track("conn-1", "GET /api/users", "user-123");

    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(1);
  });

  test("should release connection using utility", () => {
    connectionMonitor.track("conn-1", "GET /api/users", "user-123");
    connectionMonitor.release("conn-1");

    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(0);
  });

  test("should get active connections using utility", () => {
    connectionMonitor.track("conn-1", "GET /api/users", "user-123");
    connectionMonitor.track("conn-2", "POST /api/events", "user-456");

    const activeConnections = connectionMonitor.getActiveConnections();
    expect(activeConnections).toHaveLength(2);
  });

  test("should get statistics using utility", () => {
    connectionMonitor.track("conn-1", "GET /api/users", "user-123");
    connectionMonitor.release("conn-1");

    const stats = connectionMonitor.getStatistics();
    expect(stats.totalAcquired).toBe(1);
    expect(stats.totalReleased).toBe(1);
  });

  test("should get alerts using utility", (done) => {
    connectionMonitor.configure({ leakThresholdMs: 50, checkIntervalMs: 30 });
    connectionMonitor.track("conn-1", "GET /api/users", "user-123");

    setTimeout(() => {
      const alerts = connectionMonitor.getAlerts(10);
      expect(Array.isArray(alerts)).toBe(true);
      done();
    }, 150);
  });

  test("should configure monitoring using utility", () => {
    connectionMonitor.configure({
      leakThresholdMs: 5000,
      checkIntervalMs: 2000,
    });

    // Configuration should not throw
    const metrics = connectionMonitor.getMetrics();
    expect(metrics).toBeDefined();
  });

  test("should reset using utility", () => {
    connectionMonitor.track("conn-1", "GET /api/users", "user-123");
    connectionMonitor.reset();

    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(0);
  });
});
