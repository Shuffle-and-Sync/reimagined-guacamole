import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

// Common middleware functions

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error("Unhandled error in request", error, {
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Don't leak internal error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    message: "Internal server error",
    ...(isDevelopment && { error: error.message, stack: error.stack }),
  });
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    });
  });

  next();
};

export const corsHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
};

export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
};
