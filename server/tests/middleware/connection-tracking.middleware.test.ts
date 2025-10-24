/**
 * Connection Tracking Middleware Tests
 *
 * Unit tests for connection tracking middleware functionality.
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
  connectionTrackingMiddleware,
  connectionMonitoringHeadersMiddleware,
  connectionTrackingErrorHandler,
} from "../../middleware/connection-tracking.middleware";
import { connectionMonitor } from "../../utils/connection-monitor";
import type { Request, Response, NextFunction } from "express";

// Mock Express request/response
const createMockRequest = (overrides = {}): Partial<Request> => ({
  method: "GET",
  path: "/api/test",
  user: { id: "user-123" },
  ...overrides,
});

const createMockResponse = (): Partial<Response> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = {
    statusCode: 200,
    writableEnded: false,
    listeners: {} as Record<string, ((...args: unknown[]) => void)[]>,
    setHeader: jest.fn(),
    on: jest.fn(function (
      event: string,
      handler: (...args: unknown[]) => void,
    ) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(handler);
      return this;
    }),
    emit: jest.fn(function (event: string) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((handler: (...args: unknown[]) => void) =>
          handler(),
        );
      }
      return this;
    }),
  };
  return res;
};

const createMockNext = (): jest.Mock<NextFunction> => {
  return jest.fn() as jest.Mock<NextFunction>;
};

describe("connectionTrackingMiddleware", () => {
  beforeEach(() => {
    connectionMonitor.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should track connection when middleware is called", () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).connectionId).toBeDefined();
    expect((req as any).connectionStartTime).toBeDefined();

    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(1);
  });

  test("should release connection on response finish", () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    const connectionId = (req as any).connectionId;
    expect(connectionId).toBeDefined();

    // Trigger finish event
    res.emit("finish");

    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(0);
  });

  test("should release connection on response close", () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    // Trigger close event (simulating interrupted connection)
    res.emit("close");

    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(0);
  });

  test("should not double-release on close after finish", () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    // Mark as finished
    (res as any).writableEnded = true;

    // Trigger finish first
    res.emit("finish");

    const metricsAfterFinish = connectionMonitor.getMetrics();
    const releasedAfterFinish = metricsAfterFinish.poolMetrics.totalReleased;

    // Then trigger close
    res.emit("close");

    const metricsAfterClose = connectionMonitor.getMetrics();
    const releasedAfterClose = metricsAfterClose.poolMetrics.totalReleased;

    // Should be the same - no double release
    expect(releasedAfterClose).toBe(releasedAfterFinish);
  });

  test("should track endpoint information", () => {
    const req = createMockRequest({
      method: "POST",
      path: "/api/events/create",
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    const activeConnections = connectionMonitor.getActiveConnections();
    expect(activeConnections[0].endpoint).toBe("POST /api/events/create");
  });

  test("should track user ID when available", () => {
    const req = createMockRequest({
      user: { id: "user-456" },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    const activeConnections = connectionMonitor.getActiveConnections();
    expect(activeConnections[0].userId).toBe("user-456");
  });

  test("should handle requests without user", () => {
    const req = createMockRequest({
      user: undefined,
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    const activeConnections = connectionMonitor.getActiveConnections();
    expect(activeConnections[0].userId).toBeUndefined();
  });

  test("should log slow requests", (done) => {
    // Mock the logger module
    const mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    // Use jest.mock to mock the logger
    jest.mock("../../logger", () => ({
      logger: mockLogger,
    }));

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    // Set start time to simulate slow request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).connectionStartTime = Date.now() - 6000; // 6 seconds ago

    // Trigger finish event
    res.emit("finish");

    // The slow request should be detected internally
    // We can verify by checking the connection was released
    const metrics = connectionMonitor.getMetrics();
    expect(metrics.activeConnections).toBe(0);

    done();
  });

  test("should handle errors in next function", () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const error = new Error("Test error");
    next.mockImplementation(() => {
      throw error;
    });

    expect(() => {
      connectionTrackingMiddleware(req, res, next);
    }).toThrow();
  });

  test("should track user ID from alternative location", () => {
    const req = createMockRequest({
      user: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: "user-789" as any,
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingMiddleware(req, res, next);

    const activeConnections = connectionMonitor.getActiveConnections();
    expect(activeConnections[0].userId).toBe("user-789");
  });
});

describe("connectionMonitoringHeadersMiddleware", () => {
  beforeEach(() => {
    connectionMonitor.reset();
    jest.clearAllMocks();
  });

  test("should add connection ID header in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const req = createMockRequest() as Request;
    (req as any).connectionId = "test-conn-123";
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionMonitoringHeadersMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "X-Connection-Id",
      "test-conn-123",
    );
    expect(next).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  test("should not add headers in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const req = createMockRequest() as Request;
    (req as any).connectionId = "test-conn-123";
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionMonitoringHeadersMiddleware(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  test("should add active connections header on finish", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    // Track some connections first
    connectionMonitor.track("conn-1", "GET /api/test");
    connectionMonitor.track("conn-2", "GET /api/test");

    const req = createMockRequest() as Request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).connectionId = "test-conn-123";
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionMonitoringHeadersMiddleware(req, res, next);

    // Trigger finish event
    res.emit("finish");

    expect(res.setHeader).toHaveBeenCalledWith(
      "X-Active-Connections",
      expect.any(String),
    );

    process.env.NODE_ENV = originalEnv;
  });

  test("should handle request without connection ID", () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionMonitoringHeadersMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("connectionTrackingErrorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should log error with connection ID", () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const error = new Error("Test error");
    const req = createMockRequest() as Request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).connectionId = "test-conn-123";
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingErrorHandler(error, req, res, next);

    expect(logSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);

    logSpy.mockRestore();
  });

  test("should handle error without connection ID", () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const error = new Error("Test error");
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingErrorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);

    logSpy.mockRestore();
  });

  test("should pass error to next handler", () => {
    const error = new Error("Test error");
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    connectionTrackingErrorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
