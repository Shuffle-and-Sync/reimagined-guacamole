import { Request, Response } from 'express';
import { storage } from './storage';
import { logger } from './logger';

export async function healthCheck(_req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await storage.getCommunities();
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'operational',
        responseTime: `${responseTime}ms`
      },
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
}