import { Router, Request, Response } from 'express';
import { twitchAPI } from '../services/twitch-api';
import { streamingCoordinator } from '../services/streaming-coordinator';
// Simple logger since logger is not exported from validation
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
};

const router = Router();

/**
 * Raw body middleware for webhook signature verification
 * Must capture raw body before JSON parsing for HMAC verification
 */
function rawBodyMiddleware(req: Request, res: Response, next: Function) {
  let rawBody = '';
  
  req.on('data', (chunk) => {
    rawBody += chunk;
  });
  
  req.on('end', () => {
    (req as any).rawBody = rawBody;
    next();
  });
}

/**
 * Twitch EventSub webhook endpoint
 * Handles stream.online, stream.offline, and other Twitch events
 */
router.post('/twitch', rawBodyMiddleware, async (req: Request, res: Response) => {
  try {
    logger.info('Twitch EventSub webhook received', {
      headers: req.headers,
      messageType: req.headers['twitch-eventsub-message-type']
    });

    // Handle the webhook with proper security verification
    const event = twitchAPI.handleWebhook(req, res);
    
    if (event) {
      // Process the verified event
      await streamingCoordinator.handlePlatformEvent('twitch', event);
      
      logger.info('Twitch EventSub event processed', {
        eventType: event.event_type,
        eventId: event.id
      });
    }
    
    // Response is already sent by handleWebhook
  } catch (error) {
    logger.error('Error processing Twitch webhook', { error });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * YouTube webhook endpoint (placeholder)
 */
router.post('/youtube', async (req: Request, res: Response) => {
  try {
    logger.info('YouTube webhook received', { body: req.body });
    
    // TODO: Implement YouTube webhook verification and processing
    
    res.status(200).json({ message: 'YouTube webhook received' });
  } catch (error) {
    logger.error('Error processing YouTube webhook', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Facebook webhook endpoint (placeholder)
 */
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    logger.info('Facebook webhook received', { body: req.body });
    
    // TODO: Implement Facebook webhook verification and processing
    
    res.status(200).json({ message: 'Facebook webhook received' });
  } catch (error) {
    logger.error('Error processing Facebook webhook', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    webhooks: ['twitch', 'youtube', 'facebook']
  });
});

export default router;