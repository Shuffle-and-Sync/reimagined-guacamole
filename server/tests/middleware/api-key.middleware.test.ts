import { Request, Response, NextFunction } from "express";
import {
  authenticateApiKey,
  optionalApiKey,
} from "../../middleware/api-key.middleware";

describe("API Key Middleware", () => {
  const mockRequest = (apiKey?: string): Partial<Request> => ({
    headers: apiKey ? { "x-api-key": apiKey } : {},
    ip: "127.0.0.1",
    path: "/api/metrics",
    get: jest.fn((header: string) => {
      if (header === "user-agent") return "test-agent";
      return undefined;
    }),
  });

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res;
  };

  const mockNext: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticateApiKey", () => {
    const originalEnv = process.env.MONITORING_API_KEY;

    beforeEach(() => {
      process.env.MONITORING_API_KEY = "test-api-key-12345";
    });

    afterEach(() => {
      process.env.MONITORING_API_KEY = originalEnv;
    });

    it("should reject request without API key", () => {
      const req = mockRequest();
      const res = mockResponse();

      authenticateApiKey(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "API key required" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with invalid API key", () => {
      const req = mockRequest("wrong-api-key");
      const res = mockResponse();

      authenticateApiKey(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid API key" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept request with valid API key", () => {
      const req = mockRequest("test-api-key-12345");
      const res = mockResponse();

      authenticateApiKey(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 500 if MONITORING_API_KEY is not configured", () => {
      delete process.env.MONITORING_API_KEY;

      const req = mockRequest("any-key");
      const res = mockResponse();

      authenticateApiKey(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Server configuration error",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject API key with different length (timing attack protection)", () => {
      const req = mockRequest("short");
      const res = mockResponse();

      authenticateApiKey(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid API key" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject non-string API key header", () => {
      const req = {
        headers: { "x-api-key": ["array-value"] },
        ip: "127.0.0.1",
        path: "/api/metrics",
        get: jest.fn(),
      };
      const res = mockResponse();

      authenticateApiKey(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "API key required" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("optionalApiKey", () => {
    const originalEnv = process.env.MONITORING_API_KEY;

    beforeEach(() => {
      process.env.MONITORING_API_KEY = "test-api-key-12345";
    });

    afterEach(() => {
      process.env.MONITORING_API_KEY = originalEnv;
    });

    it("should continue without authentication when no API key provided", () => {
      const req: any = mockRequest();
      const res = mockResponse();

      optionalApiKey(req as Request, res as Response, mockNext);

      expect(req.isApiAuthenticated).toBe(false);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should set isApiAuthenticated to false for invalid API key", () => {
      const req: any = mockRequest("wrong-key");
      const res = mockResponse();

      optionalApiKey(req as Request, res as Response, mockNext);

      expect(req.isApiAuthenticated).toBe(false);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should set isApiAuthenticated to true for valid API key", () => {
      const req: any = mockRequest("test-api-key-12345");
      const res = mockResponse();

      optionalApiKey(req as Request, res as Response, mockNext);

      expect(req.isApiAuthenticated).toBe(true);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should continue when MONITORING_API_KEY is not configured", () => {
      delete process.env.MONITORING_API_KEY;

      const req: any = mockRequest("any-key");
      const res = mockResponse();

      optionalApiKey(req as Request, res as Response, mockNext);

      expect(req.isApiAuthenticated).toBe(false);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should handle buffer length mismatch gracefully", () => {
      const req: any = mockRequest("short");
      const res = mockResponse();

      optionalApiKey(req as Request, res as Response, mockNext);

      expect(req.isApiAuthenticated).toBe(false);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
