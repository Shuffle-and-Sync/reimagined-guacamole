import { logger } from "./logger";

interface BandwidthStats {
  requests: number;
  totalBytes: number;
  lastReset: Date;
}

class BandwidthMonitor {
  private stats: BandwidthStats = {
    requests: 0,
    totalBytes: 0,
    lastReset: new Date()
  };
  
  private readonly RESET_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly MAX_REQUESTS_PER_HOUR = 10000;
  private readonly MAX_BYTES_PER_HOUR = 100 * 1024 * 1024; // 100MB
  
  constructor() {
    // Reset stats periodically
    setInterval(() => {
      this.resetStats();
    }, this.RESET_INTERVAL);
  }
  
  logRequest(bytes: number = 0) {
    this.stats.requests++;
    this.stats.totalBytes += bytes;
    
    // Check limits
    if (this.stats.requests > this.MAX_REQUESTS_PER_HOUR) {
      logger.warn("High request volume detected", {
        requests: this.stats.requests,
        timeWindow: "1 hour"
      });
    }
    
    if (this.stats.totalBytes > this.MAX_BYTES_PER_HOUR) {
      logger.warn("High bandwidth usage detected", {
        bytes: this.stats.totalBytes,
        megabytes: Math.round(this.stats.totalBytes / (1024 * 1024)),
        timeWindow: "1 hour"
      });
    }
  }
  
  getStats(): BandwidthStats {
    return { ...this.stats };
  }
  
  private resetStats() {
    const previousStats = { ...this.stats };
    
    this.stats = {
      requests: 0,
      totalBytes: 0,
      lastReset: new Date()
    };
    
    logger.info("Bandwidth stats reset", {
      previousHour: {
        requests: previousStats.requests,
        totalBytes: previousStats.totalBytes,
        megabytes: Math.round(previousStats.totalBytes / (1024 * 1024))
      }
    });
  }
}

export const bandwidthMonitor = new BandwidthMonitor();

// Middleware for monitoring requests
export function monitoringMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  // Log request
  bandwidthMonitor.logRequest();
  
  // Monitor response
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    const contentLength = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data || '', 'utf8');
    
    bandwidthMonitor.logRequest(contentLength);
    
    // Log slow requests
    if (responseTime > 5000) { // 5 seconds
      logger.warn("Slow request detected", {
        method: req.method,
        path: req.path,
        responseTime,
        contentLength
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

// Environment safety checks
export function validateEnvironment() {
  const checks = [
    {
      name: "Node Environment",
      check: () => process.env.NODE_ENV === 'development',
      message: "Not in development mode"
    },
    {
      name: "Server Binding",
      check: () => true, // Always pass, just for logging
      message: "Server configured for external access"
    },
    {
      name: "CORS Configuration", 
      check: () => true, // Always pass, just for logging
      message: "CORS configured for development"
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = check.check();
    if (!passed) {
      logger.error(`Environment check failed: ${check.name}`, { message: check.message });
      allPassed = false;
    } else {
      logger.info(`Environment check passed: ${check.name}`, { message: check.message });
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    logger.info("Development environment detected - External access enabled with monitoring");
  }
  
  return allPassed;
}