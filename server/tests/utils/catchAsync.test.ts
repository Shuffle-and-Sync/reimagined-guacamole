/**
 * Tests for catchAsync utility
 */

import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";

describe("catchAsync", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test("should execute async function successfully", async () => {
    const asyncHandler = catchAsync(async (req, res) => {
      res.json({ success: true });
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should catch errors and pass to next()", async () => {
    const error = new Error("Test error");
    const asyncHandler = catchAsync(async () => {
      throw error;
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  test("should catch rejected promises", async () => {
    const error = new Error("Promise rejection");
    const asyncHandler = catchAsync(async () => {
      return Promise.reject(error);
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Give time for the promise rejection to be caught
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  test("should preserve request context", async () => {
    mockRequest = { params: { id: "123" }, body: { name: "test" } };
    let capturedReq: Request | undefined;

    const asyncHandler = catchAsync(async (req) => {
      capturedReq = req;
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(capturedReq).toBe(mockRequest);
    expect(capturedReq?.params?.id).toBe("123");
    expect(capturedReq?.body?.name).toBe("test");
  });

  test("should allow access to response methods", async () => {
    const asyncHandler = catchAsync(async (req, res) => {
      res.status(201).json({ id: "123" });
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ id: "123" });
  });

  test("should handle async database operations", async () => {
    const mockDbCall = jest.fn().mockResolvedValue({ id: "1", name: "User 1" });

    const asyncHandler = catchAsync(async (req, res) => {
      const user = await mockDbCall();
      res.json(user);
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockDbCall).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: "1",
      name: "User 1",
    });
  });

  test("should catch database errors", async () => {
    const dbError = new Error("Database connection failed");
    const mockDbCall = jest.fn().mockRejectedValue(dbError);

    const asyncHandler = catchAsync(async () => {
      await mockDbCall();
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Give time for the promise rejection to be caught
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  test("should allow calling next() explicitly", async () => {
    const customError = new Error("Custom error");

    const asyncHandler = catchAsync(async (req, res, next) => {
      next(customError);
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(customError);
  });

  test("should handle multiple async operations", async () => {
    const operation1 = jest.fn().mockResolvedValue("result1");
    const operation2 = jest.fn().mockResolvedValue("result2");

    const asyncHandler = catchAsync(async (req, res) => {
      const result1 = await operation1();
      const result2 = await operation2();
      res.json({ result1, result2 });
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Give time for all operations to complete
    await new Promise((resolve) => setImmediate(resolve));

    expect(operation1).toHaveBeenCalled();
    expect(operation2).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith({
      result1: "result1",
      result2: "result2",
    });
  });

  test("should catch the first error in chain", async () => {
    const error = new Error("First error");
    const operation1 = jest.fn().mockRejectedValue(error);
    const operation2 = jest.fn();

    const asyncHandler = catchAsync(async () => {
      await operation1();
      await operation2(); // Should not be called
    });

    await asyncHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Give time for the promise rejection to be caught
    await new Promise((resolve) => setImmediate(resolve));

    expect(operation1).toHaveBeenCalled();
    expect(operation2).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
