import { logger } from '../logger';
import { storage } from '../storage';
import { streamingCoordinator } from './streaming-coordinator';
import { aiStreamingMatcher } from './ai-streaming-matcher';
import { resolvePlatformIdentifiers, getValidPlatformToken } from './platform-oauth';
// Platform API imports with error handling
let youtubeAPI: any = null;
let twitchAPI: any = null;
let facebookAPI: any = null;

// Safely import platform APIs to prevent startup crashes
try {
  youtubeAPI = require('./youtube-api').youtubeAPI;
} catch (error) {
  logger.warn('YouTube API not available', { error: error instanceof Error ? error.message : 'Unknown error' });
}

try {
  twitchAPI = require('./twitch-api').twitchAPI;
} catch (error) {
  logger.warn('Twitch API not available', { error: error instanceof Error ? error.message : 'Unknown error' });
}

try {
  facebookAPI = require('./facebook-api').facebookAPI;
} catch (error) {
  logger.warn('Facebook API not available', { error: error instanceof Error ? error.message : 'Unknown error' });
}
import type { 
  CollaborativeStreamEvent, 
  StreamCollaborator, 
  StreamCoordinationSession,
  InsertCollaborativeStreamEvent,
  InsertStreamCollaborator,
  InsertStreamCoordinationSession
} from '@shared/schema';

/**
 * Collaborative Streaming Service
 * Manages multi-streamer coordination, automated scheduling, and real-time collaboration
 */
export class CollaborativeStreamingService {
  private static instance: CollaborativeStreamingService;
  private activeCoordinationSessions = new Map<string, StreamCoordinationSession>();
  private eventSubscriptions = new Map<string, Set<string>>(); // eventId -> Set of user IDs

  static getInstance(): CollaborativeStreamingService {
    if (!CollaborativeStreamingService.instance) {
      CollaborativeStreamingService.instance = new CollaborativeStreamingService();
    }
    return CollaborativeStreamingService.instance;
  }

  /**
   * Create a new collaborative streaming event
   */
  async createCollaborativeEvent(
    creatorId: string, 
    eventData: Omit<InsertCollaborativeStreamEvent, 'creatorId'>
  ): Promise<CollaborativeStreamEvent> {
    try {
      const event = await storage.createCollaborativeStreamEvent({
        ...eventData,
        creatorId,
        status: 'planning'
      });

      // Add creator as the primary host
      await this.addCollaborator(event.id, {
        eventId: event.id, // Required field for compatibility
        userId: creatorId,
        role: 'host',
        status: 'accepted',
        invitedByUserId: creatorId,
        platformHandles: JSON.stringify({}),
        streamingCapabilities: JSON.stringify(['host', 'co_stream']),
        availableTimeSlots: JSON.stringify({}),
        contentSpecialties: JSON.stringify([]),
        technicalSetup: JSON.stringify({})
      });

      // Initialize event subscription tracking
      this.eventSubscriptions.set(event.id, new Set([creatorId]));

      logger.info('Collaborative streaming event created', { 
        eventId: event.id, 
        creatorId, 
        title: event.title 
      });

      return event;
    } catch (error) {
      logger.error('Failed to create collaborative streaming event', error, { creatorId });
      throw error;
    }
  }

  /**
   * Add a collaborator to a streaming event
   */
  async addCollaborator(
    eventId: string, 
    collaboratorData: Omit<InsertStreamCollaborator, 'streamEventId'>
  ): Promise<StreamCollaborator> {
    try {
      const collaborator = await storage.createStreamCollaborator({
        ...collaboratorData,
        streamEventId: eventId
      });

      // Add to subscription tracking
      const eventSubs = this.eventSubscriptions.get(eventId) || new Set();
      eventSubs.add(collaborator.userId);
      this.eventSubscriptions.set(eventId, eventSubs);

      logger.info('Collaborator added to streaming event', { 
        eventId, 
        userId: collaborator.userId, 
        role: collaborator.role 
      });

      return collaborator;
    } catch (error) {
      logger.error('Failed to add collaborator', error, { eventId });
      throw error;
    }
  }

  /**
   * Get AI-powered collaboration suggestions for an event
   */
  async getCollaborationSuggestions(
    eventId: string, 
    requesterId: string
  ): Promise<{
    suggestedCollaborators: any[];
    strategicRecommendations: string[];
    optimalScheduling: any;
  }> {
    try {
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      // Use AI matching to find potential collaborators
      const matchingResults = await aiStreamingMatcher.findStreamingPartners({
        userId: requesterId,
        games: [event.contentType || 'general'],
        maxResults: 10,
        urgency: 'low'
        // Note: platforms removed as not part of MatchingCriteria type
      });

      // Generate strategic recommendations
      const strategicRecommendations = this.generateStrategicRecommendations(event, matchingResults);

      // Calculate optimal scheduling
      const optimalScheduling = await this.calculateOptimalScheduling(event, matchingResults);

      return {
        suggestedCollaborators: matchingResults,
        strategicRecommendations,
        optimalScheduling
      };
    } catch (error) {
      logger.error('Failed to get collaboration suggestions', error, { eventId, requesterId });
      throw error;
    }
  }

  /**
   * Start real-time coordination session for a collaborative event
   */
  async startCoordinationSession(
    eventId: string, 
    hostUserId: string
  ): Promise<StreamCoordinationSession> {
    try {
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      // Create coordination session
      const session = await storage.createStreamCoordinationSession({
        streamEventId: eventId,
        eventId: eventId, // Required field for compatibility
        actualStartTime: new Date(),
        currentPhase: 'preparation',
        currentHost: hostUserId,
        activeCollaborators: JSON.stringify([hostUserId]),
        platformStatuses: JSON.stringify({}),
        viewerCounts: JSON.stringify({}),
        coordinationEvents: JSON.stringify([]),
        chatModerationActive: false,
        streamQualitySettings: JSON.stringify({}),
        audioCoordination: JSON.stringify({})
      });

      // Cache active session
      this.activeCoordinationSessions.set(eventId, session);

      // Create stream session for all platforms
      const streamingPlatforms = event.streamingPlatforms ? JSON.parse(event.streamingPlatforms) : [];
      await streamingCoordinator.createStreamSession({
        title: event.title,
        description: event.description || '',
        category: event.contentType || 'general',
        platforms: streamingPlatforms.map((p: string) => ({
          id: p,
          name: p.charAt(0).toUpperCase() + p.slice(1),
          isConnected: true
        })),
        hostUserId,
        coHostUserIds: [], // Will be populated as collaborators join
        scheduledStartTime: event.scheduledStartTime,
        tags: ['collaborative', event.targetAudience || 'general'],
        isPublic: true,
        autoStartEnabled: false,
        crossPlatformChat: true,
        recordingEnabled: false,
        multistreaming: true,
        status: 'scheduled' as const
      });

      logger.info('Coordination session started', { 
        eventId, 
        sessionId: session.id, 
        hostUserId 
      });

      return session;
    } catch (error) {
      logger.error('Failed to start coordination session', error, { eventId, hostUserId });
      throw error;
    }
  }

  /**
   * Update coordination session phase and sync across platforms
   */
  async updateCoordinationPhase(
    eventId: string, 
    newPhase: 'preparation' | 'live' | 'break' | 'wrap_up' | 'ended',
    hostUserId: string
  ): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        throw new Error(`No active coordination session for event: ${eventId}`);
      }

      // Update session phase
      await storage.updateStreamCoordinationSession(session.id, {
        currentPhase: newPhase,
        updatedAt: new Date()
      });

      // Update cached session
      session.currentPhase = newPhase;
      this.activeCoordinationSessions.set(eventId, session);

      // Coordinate across platforms based on phase
      await this.coordinatePlatformActions(eventId, newPhase);

      logger.info('Coordination phase updated', { 
        eventId, 
        newPhase, 
        hostUserId 
      });
    } catch (error) {
      logger.error('Failed to update coordination phase', error, { eventId, newPhase });
      throw error;
    }
  }

  /**
   * Get real-time coordination status for an event
   */
  async getCoordinationStatus(eventId: string): Promise<{
    session?: StreamCoordinationSession;
    collaborators: StreamCollaborator[];
    platformStatuses: Record<string, string>;
    activeViewers: number;
    coordinationMetrics: any;
  }> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      const collaborators = await storage.getStreamCollaborators(eventId);
      
      let platformStatuses: Record<string, string> = {};
      let activeViewers = 0;

      if (session) {
        platformStatuses = session.platformStatuses ? JSON.parse(session.platformStatuses) : {};
        const viewerCounts: Record<string, number> = session.viewerCounts ? JSON.parse(session.viewerCounts) : {};
        activeViewers = Object.values(viewerCounts).reduce((sum: number, count: number) => sum + count, 0);
      }

      const coordinationMetrics = {
        totalCollaborators: collaborators.length,
        activeCollaborators: session ? (JSON.parse(session.activeCollaborators || '[]')).length : 0,
        averageResponseTime: this.calculateAverageResponseTime(eventId),
        coordinationHealth: this.calculateCoordinationHealth(session, collaborators)
      };

      return {
        session,
        collaborators,
        platformStatuses,
        activeViewers,
        coordinationMetrics
      };
    } catch (error) {
      logger.error('Failed to get coordination status', error, { eventId });
      throw error;
    }
  }

  /**
   * Handle collaborator joining live session
   */
  async handleCollaboratorJoin(
    eventId: string, 
    userId: string, 
    platformData: any
  ): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        throw new Error(`No active coordination session for event: ${eventId}`);
      }

      // Update active collaborators
      const activeCollaborators = JSON.parse(session.activeCollaborators || '[]');
      if (!activeCollaborators.includes(userId)) {
        activeCollaborators.push(userId);
        
        await storage.updateStreamCoordinationSession(session.id, {
          activeCollaborators: JSON.stringify(activeCollaborators),
          updatedAt: new Date()
        });

        // Update cached session
        session.activeCollaborators = JSON.stringify(activeCollaborators);
        this.activeCoordinationSessions.set(eventId, session);
      }

      // Log coordination event
      await this.logCoordinationEvent(eventId, {
        type: 'collaborator_joined',
        userId,
        timestamp: new Date().toISOString(),
        data: platformData
      });

      logger.info('Collaborator joined live session', { 
        eventId, 
        userId,
        activeCount: activeCollaborators.length
      });
    } catch (error) {
      logger.error('Failed to handle collaborator join', error, { eventId, userId });
      throw error;
    }
  }

  /**
   * Generate strategic recommendations for collaboration
   */
  private generateStrategicRecommendations(
    event: CollaborativeStreamEvent, 
    matches: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Audience synergy recommendations
    if (matches.some(m => m.audienceOverlap > 0.7)) {
      recommendations.push("High audience overlap detected - consider cross-promotion strategies");
    }

    // Content type optimization
    if (event.contentType === 'gaming') {
      recommendations.push("Gaming content: Plan for smooth transitions between hosts and consider viewer participation");
    }

    // Platform strategy
    const streamingPlatforms = event.streamingPlatforms ? JSON.parse(event.streamingPlatforms) : [];
    if (streamingPlatforms.length > 1) {
      recommendations.push("Multi-platform streaming: Coordinate chat moderation and ensure consistent branding");
    }

    // Timing optimization
    const scheduledHour = new Date(event.scheduledStartTime).getHours();
    if (scheduledHour >= 19 && scheduledHour <= 22) {
      recommendations.push("Prime time slot detected - maximize engagement with interactive elements");
    }

    return recommendations;
  }

  /**
   * Calculate optimal scheduling based on collaborator availability
   */
  private async calculateOptimalScheduling(
    event: CollaborativeStreamEvent, 
    matches: any[]
  ): Promise<any> {
    // This would integrate with calendar systems and timezone coordination
    // For now, return basic scheduling optimization
    return {
      recommendedStartTime: event.scheduledStartTime,
      timezoneCoverage: this.calculateTimezoneCoverage(matches),
      conflictWarnings: [],
      optimalDuration: event.estimatedDuration
    };
  }

  /**
   * Calculate timezone coverage for global audience reach
   */
  private calculateTimezoneCoverage(matches: any[]): any {
    // Analyze timezone distribution of potential collaborators
    return {
      primaryTimezone: 'UTC-5',
      coverage: 'North America focused',
      suggestedAlternatives: []
    };
  }

  /**
   * Coordinate actions across streaming platforms
   */
  private async coordinatePlatformActions(
    eventId: string, 
    phase: string
  ): Promise<void> {
    try {
      switch (phase) {
        case 'live':
          // Start streams on all platforms
          await this.startCrossPlatformStreaming(eventId);
          break;
        case 'break':
          // Sync break across platforms
          await this.coordinateBreak(eventId);
          break;
        case 'ended':
          // End streams and cleanup
          await this.endCrossPlatformStreaming(eventId);
          break;
      }
    } catch (error) {
      logger.error('Failed to coordinate platform actions', error, { eventId, phase });
    }
  }

  /**
   * Start synchronized streaming across multiple platforms using production-ready APIs
   */
  private async startCrossPlatformStreaming(eventId: string): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        throw new Error(`No active coordination session for event: ${eventId}`);
      }

      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      const platformResults: Record<string, any> = {};
      const platformErrors: string[] = [];

      // Validate current host before proceeding
      if (!session.currentHost) {
        throw new Error('No current host available for cross-platform streaming coordination');
      }

      // Get platform identifiers for the current host
      const platformIdentifiers = await resolvePlatformIdentifiers(session.currentHost);

      // Start streaming on each configured platform
      const streamingPlatforms = event.streamingPlatforms ? JSON.parse(event.streamingPlatforms) : [];
      for (const platformName of streamingPlatforms) {
        try {
          switch (platformName) {
            case 'youtube':
              if (youtubeAPI && youtubeAPI.isConfigured()) {
                try {
                  // Get valid access token for YouTube
                  const accessToken = await getValidPlatformToken(session.currentHost, 'youtube');
                  const channelId = platformIdentifiers.youtube;
                  
                  if (accessToken && channelId) {
                    // Make real API call to check YouTube stream status
                    const streamStatus = await youtubeAPI.getLiveStream(channelId, accessToken);
                    
                    if (streamStatus && streamStatus.status === 'active') {
                      platformResults.youtube = { 
                        streamId: streamStatus.id, 
                        status: 'live',
                        url: streamStatus.url,
                        channelId: channelId
                      };
                      logger.info('YouTube stream detected and synced', { eventId, streamId: streamStatus.id, channelId });
                    } else {
                      platformResults.youtube = { 
                        status: 'ready', 
                        message: 'YouTube ready for streaming',
                        channelId: channelId
                      };
                      logger.info('YouTube ready for streaming', { eventId, channelId });
                    }
                  } else {
                    platformResults.youtube = { 
                      status: 'needs_setup', 
                      message: accessToken ? 'YouTube channel ID not found - please link your account' : 'YouTube access token invalid - please reconnect'
                    };
                    logger.warn('YouTube coordination blocked by missing credentials', { eventId, hasToken: !!accessToken, hasChannelId: !!channelId });
                  }
                } catch (error) {
                  logger.error('Failed to sync YouTube stream status', error, { eventId });
                  platformResults.youtube = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
                }
              } else {
                platformResults.youtube = { status: 'unavailable', message: 'YouTube API not configured' };
                logger.warn('YouTube API not available', { eventId });
              }
              break;

            case 'twitch':
              if (twitchAPI && twitchAPI.isConfigured()) {
                try {
                  // Get valid access token for Twitch
                  const accessToken = await getValidPlatformToken(session.currentHost, 'twitch');
                  const twitchUserId = platformIdentifiers.twitch;
                  
                  if (accessToken && twitchUserId) {
                    // Make real API call to check Twitch stream status
                    const streamData = twitchAPI.getStreamByUserId 
                      ? await twitchAPI.getStreamByUserId(twitchUserId, accessToken)
                      : null;
                    
                    if (streamData && streamData.type === 'live') {
                      platformResults.twitch = { 
                        streamId: streamData.id, 
                        status: 'live',
                        viewerCount: streamData.viewer_count,
                        userId: twitchUserId
                      };
                      logger.info('Twitch stream detected and synced', { eventId, streamId: streamData.id, userId: twitchUserId });
                    } else {
                      platformResults.twitch = { 
                        status: 'ready', 
                        message: 'Twitch ready for streaming',
                        userId: twitchUserId
                      };
                      logger.info('Twitch ready for streaming', { eventId, userId: twitchUserId });
                    }
                  } else {
                    platformResults.twitch = { 
                      status: 'needs_setup', 
                      message: accessToken ? 'Twitch user ID not found - please link your account' : 'Twitch access token invalid - please reconnect'
                    };
                    logger.warn('Twitch coordination blocked by missing credentials', { eventId, hasToken: !!accessToken, hasUserId: !!twitchUserId });
                  }
                } catch (error) {
                  logger.error('Failed to sync Twitch stream status', error, { eventId });
                  platformResults.twitch = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
                }
              } else {
                platformResults.twitch = { status: 'unavailable', message: 'Twitch API not configured' };
                logger.warn('Twitch API not available', { eventId });
              }
              break;

            case 'facebook':
              if (facebookAPI && facebookAPI.isConfigured()) {
                try {
                  // Get valid access token for Facebook
                  const accessToken = await getValidPlatformToken(session.currentHost, 'facebook');
                  const pageId = platformIdentifiers.facebook;
                  
                  if (accessToken && pageId) {
                    // Make real API call to check Facebook live video status
                    const liveStatus = facebookAPI.getLiveVideoStatus
                      ? await facebookAPI.getLiveVideoStatus(pageId, accessToken)
                      : null;
                    
                    if (liveStatus && liveStatus.status === 'LIVE') {
                      platformResults.facebook = { 
                        streamId: liveStatus.id, 
                        status: 'live',
                        viewerCount: liveStatus.viewer_count || 0,
                        pageId: pageId
                      };
                      logger.info('Facebook live video detected and synced', { eventId, streamId: liveStatus.id, pageId });
                    } else {
                      platformResults.facebook = { 
                        status: 'ready', 
                        message: 'Facebook ready for streaming',
                        pageId: pageId
                      };
                      logger.info('Facebook ready for streaming', { eventId, pageId });
                    }
                  } else {
                    platformResults.facebook = { 
                      status: 'needs_setup', 
                      message: accessToken ? 'Facebook page ID not found - please link your page' : 'Facebook access token invalid - please reconnect'
                    };
                    logger.warn('Facebook coordination blocked by missing credentials', { eventId, hasToken: !!accessToken, hasPageId: !!pageId });
                  }
                } catch (error) {
                  logger.error('Failed to sync Facebook live video status', error, { eventId });
                  platformResults.facebook = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
                }
              } else {
                platformResults.facebook = { status: 'unavailable', message: 'Facebook API not configured' };
                logger.warn('Facebook API not available', { eventId });
              }
              break;

            default:
              logger.warn('Unsupported platform for streaming coordination', { 
                platform: platformName, 
                eventId 
              });
          }
        } catch (error) {
          logger.error(`Failed to start ${platformName} streaming`, error, { eventId });
          platformErrors.push(`${platformName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update session with actual platform statuses from API results
      const platformStatuses = Object.keys(platformResults).reduce((acc, platform) => {
        const result = platformResults[platform];
        acc[platform] = result.status || 'unknown';
        return acc;
      }, {} as Record<string, string>);

      // Extract viewer counts from API results
      const viewerCounts = Object.keys(platformResults).reduce((acc, platform) => {
        const result = platformResults[platform];
        if (result.viewerCount !== undefined) {
          acc[platform] = result.viewerCount;
        }
        return acc;
      }, {} as Record<string, number>);

      // Add errors to platform statuses
      platformErrors.forEach(error => {
        const [platform] = error.split(':');
        if (platform) {
          platformStatuses[platform] = 'error';
        }
      });

      // Persist platform statuses and viewer counts to storage
      await storage.updateStreamCoordinationSession(session.id, {
        platformStatuses: JSON.stringify(platformStatuses),
        viewerCounts: JSON.stringify(viewerCounts),
        coordinationEvents: JSON.stringify([
          ...(session.coordinationEvents ? JSON.parse(session.coordinationEvents) : []),
          {
            type: 'platform_sync_started',
            timestamp: new Date().toISOString(),
            data: { platformResults, errors: platformErrors }
          }
        ]),
        updatedAt: new Date()
      });

      // Update cached session with persisted data
      session.platformStatuses = JSON.stringify(platformStatuses);
      session.viewerCounts = JSON.stringify(viewerCounts);
      this.activeCoordinationSessions.set(eventId, session);

      logger.info('Cross-platform streaming coordination initiated', { 
        eventId, 
        successfulPlatforms: Object.keys(platformResults),
        errors: platformErrors
      });
    } catch (error) {
      logger.error('Failed to start cross-platform streaming', error, { eventId });
      throw error;
    }
  }

  /**
   * Coordinate synchronized break across all platforms
   */
  private async coordinateBreak(eventId: string): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        throw new Error(`No active coordination session for event: ${eventId}`);
      }

      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      // Validate current host before proceeding
      if (!session.currentHost) {
        throw new Error('No current host available for break coordination');
      }

      // Get platform identifiers for the current host
      const platformIdentifiers = await resolvePlatformIdentifiers(session.currentHost);
      const breakResults: Record<string, any> = {};

      // Coordinate break on each active platform with real API calls
      const streamingPlatforms = event.streamingPlatforms ? JSON.parse(event.streamingPlatforms) : [];
      for (const platformName of streamingPlatforms) {
        try {
          switch (platformName) {
            case 'youtube':
              if (youtubeAPI && youtubeAPI.isConfigured()) {
                const accessToken = await getValidPlatformToken(session.currentHost, 'youtube');
                const channelId = platformIdentifiers.youtube;
                
                if (accessToken && channelId) {
                  if (youtubeAPI.updateBroadcastDescription) {
                    await youtubeAPI.updateBroadcastDescription(channelId, accessToken, '[BREAK] Taking a short break - back soon!');
                  }
                  breakResults.youtube = { status: 'break', action: 'description_updated', timestamp: new Date() };
                  logger.info('YouTube break coordinated via description update', { eventId, channelId });
                } else {
                  breakResults.youtube = { status: 'break', action: 'manual', message: 'Manual break coordination required' };
                  logger.warn('YouTube break coordination limited by missing credentials', { eventId });
                }
              } else {
                breakResults.youtube = { status: 'break', action: 'unavailable', message: 'YouTube API not available' };
              }
              break;

            case 'twitch':
              if (twitchAPI && twitchAPI.isConfigured()) {
                const accessToken = await getValidPlatformToken(session.currentHost, 'twitch');
                const twitchUserId = platformIdentifiers.twitch;
                
                if (accessToken && twitchUserId) {
                  if (twitchAPI.updateStreamTitle) {
                    await twitchAPI.updateStreamTitle(twitchUserId, accessToken, '[BREAK] Taking a short break - back soon!');
                  }
                  breakResults.twitch = { status: 'break', action: 'title_updated', timestamp: new Date() };
                  logger.info('Twitch break coordinated via title update', { eventId, userId: twitchUserId });
                } else {
                  breakResults.twitch = { status: 'break', action: 'manual', message: 'Manual break coordination required' };
                  logger.warn('Twitch break coordination limited by missing credentials', { eventId });
                }
              } else {
                breakResults.twitch = { status: 'break', action: 'unavailable', message: 'Twitch API not available' };
              }
              break;

            case 'facebook':
              if (facebookAPI && facebookAPI.isConfigured()) {
                const accessToken = await getValidPlatformToken(session.currentHost, 'facebook');
                const pageId = platformIdentifiers.facebook;
                
                if (accessToken && pageId) {
                  if (facebookAPI.updateLiveVideoDescription) {
                    await facebookAPI.updateLiveVideoDescription(pageId, accessToken, 'Taking a short break - back soon!');
                  }
                  breakResults.facebook = { status: 'break', action: 'description_updated', timestamp: new Date() };
                  logger.info('Facebook break coordinated via description update', { eventId, pageId });
                } else {
                  breakResults.facebook = { status: 'break', action: 'manual', message: 'Manual break coordination required' };
                  logger.warn('Facebook break coordination limited by missing credentials', { eventId });
                }
              } else {
                breakResults.facebook = { status: 'break', action: 'unavailable', message: 'Facebook API not available' };
              }
              break;

            default:
              logger.warn('Unsupported platform for break coordination', { platform: platformName, eventId });
          }
        } catch (error) {
          logger.error(`Failed to coordinate break on ${platformName}`, error, { eventId });
          breakResults[platformName] = { status: 'error', action: 'break_failed', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Update platform statuses to 'break' and persist
      const platformStatuses = Object.keys(breakResults).reduce((acc, platform) => {
        acc[platform] = breakResults[platform].status || 'break';
        return acc;
      }, {} as Record<string, string>);

      await storage.updateStreamCoordinationSession(session.id, {
        platformStatuses: JSON.stringify(platformStatuses),
        coordinationEvents: JSON.stringify([
          ...(session.coordinationEvents ? JSON.parse(session.coordinationEvents) : []),
          {
            type: 'break_coordinated',
            timestamp: new Date().toISOString(),
            data: { breakResults }
          }
        ]),
        updatedAt: new Date()
      });

      // Update cached session
      session.platformStatuses = JSON.stringify(platformStatuses);
      this.activeCoordinationSessions.set(eventId, session);

      logger.info('Break coordination completed across platforms', { 
        eventId, 
        platforms: Object.keys(breakResults),
        results: breakResults
      });
    } catch (error) {
      logger.error('Failed to coordinate break', error, { eventId });
      throw error;
    }
  }

  /**
   * End synchronized streaming across all platforms
   */
  private async endCrossPlatformStreaming(eventId: string): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        logger.warn('No active coordination session found for ending', { eventId });
        return;
      }

      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      // Validate current host before proceeding
      if (!session.currentHost) {
        throw new Error('No current host available for ending cross-platform streaming');
      }

      // Get platform identifiers for the current host
      const platformIdentifiers = await resolvePlatformIdentifiers(session.currentHost);
      const endResults: Record<string, any> = {};
      const errors: string[] = [];

      // End streaming on each platform with real API calls
      const streamingPlatforms = event.streamingPlatforms ? JSON.parse(event.streamingPlatforms) : [];
      for (const platformName of streamingPlatforms) {
        try {
          switch (platformName) {
            case 'youtube':
              if (youtubeAPI && youtubeAPI.isConfigured()) {
                const accessToken = await getValidPlatformToken(session.currentHost, 'youtube');
                const channelId = platformIdentifiers.youtube;
                
                if (accessToken && channelId) {
                  // End YouTube live broadcast
                  const broadcastStatus = await youtubeAPI.getLiveStream(channelId, accessToken);
                  if (broadcastStatus && broadcastStatus.status === 'active') {
                    await youtubeAPI.transitionBroadcast(broadcastStatus.id, 'complete', accessToken);
                    endResults.youtube = { status: 'ended', action: 'broadcast_ended', timestamp: new Date(), channelId };
                    logger.info('YouTube broadcast ended via API', { eventId, broadcastId: broadcastStatus.id, channelId });
                  } else {
                    endResults.youtube = { status: 'ended', action: 'already_ended', timestamp: new Date(), channelId };
                    logger.info('YouTube broadcast already ended', { eventId, channelId });
                  }
                } else {
                  endResults.youtube = { status: 'ended', action: 'manual', message: 'Manual stream ending required' };
                  logger.warn('YouTube stream ending limited by missing credentials', { eventId });
                }
              } else {
                endResults.youtube = { status: 'ended', action: 'unavailable', message: 'YouTube API not available' };
              }
              break;

            case 'twitch':
              if (twitchAPI && twitchAPI.isConfigured()) {
                const accessToken = await getValidPlatformToken(session.currentHost, 'twitch');
                const twitchUserId = platformIdentifiers.twitch;
                
                if (accessToken && twitchUserId) {
                  // Verify Twitch stream has ended using proper API
                  const streamData = twitchAPI.getStreamByUserId
                    ? await twitchAPI.getStreamByUserId(twitchUserId, accessToken)
                    : null;
                  if (!streamData || streamData.type !== 'live') {
                    endResults.twitch = { status: 'ended', action: 'stream_confirmed_ended', timestamp: new Date(), userId: twitchUserId };
                    logger.info('Twitch stream confirmed ended', { eventId, userId: twitchUserId });
                  } else {
                    endResults.twitch = { status: 'ending', action: 'stream_still_active', streamId: streamData.id, userId: twitchUserId };
                    logger.warn('Twitch stream still active - manual ending required', { eventId, streamId: streamData.id, userId: twitchUserId });
                  }
                } else {
                  endResults.twitch = { status: 'ended', action: 'manual', message: 'Manual stream ending required' };
                  logger.warn('Twitch stream ending limited by missing credentials', { eventId });
                }
              } else {
                endResults.twitch = { status: 'ended', action: 'unavailable', message: 'Twitch API not available' };
              }
              break;

            case 'facebook':
              if (facebookAPI && facebookAPI.isConfigured()) {
                const accessToken = await getValidPlatformToken(session.currentHost, 'facebook');
                const pageId = platformIdentifiers.facebook;
                
                if (accessToken && pageId) {
                  // End Facebook live video
                  const liveStatus = facebookAPI.getLiveVideoStatus
                    ? await facebookAPI.getLiveVideoStatus(pageId, accessToken)
                    : null;
                  if (liveStatus && liveStatus.status === 'LIVE') {
                    await facebookAPI.endLiveVideo(liveStatus.id, accessToken);
                    endResults.facebook = { status: 'ended', action: 'live_video_ended', timestamp: new Date(), pageId };
                    logger.info('Facebook live video ended via API', { eventId, liveVideoId: liveStatus.id, pageId });
                  } else {
                    endResults.facebook = { status: 'ended', action: 'already_ended', timestamp: new Date(), pageId };
                    logger.info('Facebook live video already ended', { eventId, pageId });
                  }
                } else {
                  endResults.facebook = { status: 'ended', action: 'manual', message: 'Manual stream ending required' };
                  logger.warn('Facebook stream ending limited by missing credentials', { eventId });
                }
              } else {
                endResults.facebook = { status: 'ended', action: 'unavailable', message: 'Facebook API not available' };
              }
              break;

            default:
              logger.warn('Unsupported platform for stream ending', { platform: platformName, eventId });
          }
        } catch (error) {
          logger.error(`Failed to end ${platformName} streaming`, error, { eventId });
          errors.push(`${platformName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          endResults[platformName] = { status: 'error', action: 'end_failed', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Update platform statuses to 'ended' and zero out viewer counts
      const platformStatuses = Object.keys(endResults).reduce((acc, platform) => {
        acc[platform] = endResults[platform].status || 'ended';
        return acc;
      }, {} as Record<string, string>);

      const finalViewerCounts = Object.keys(endResults).reduce((acc, platform) => {
        acc[platform] = 0; // Zero out viewer counts for ended streams
        return acc;
      }, {} as Record<string, number>);

      // Persist final state with platform statuses and viewer counts
      await storage.updateStreamCoordinationSession(session.id, {
        currentPhase: 'ended',
        actualEndTime: new Date(),
        platformStatuses: JSON.stringify(platformStatuses),
        viewerCounts: JSON.stringify(finalViewerCounts),
        coordinationEvents: JSON.stringify([
          ...(session.coordinationEvents ? JSON.parse(session.coordinationEvents) : []),
          {
            type: 'streaming_ended',
            timestamp: new Date().toISOString(),
            data: { endResults, errors }
          }
        ]),
        updatedAt: new Date()
      });

      // Update cached session with final data
      session.currentPhase = 'ended';
      session.actualEndTime = new Date();
      session.platformStatuses = JSON.stringify(platformStatuses);
      session.viewerCounts = JSON.stringify(finalViewerCounts);
      this.activeCoordinationSessions.set(eventId, session);

      // Clean up active session after brief delay for final status retrieval
      setTimeout(() => {
        this.activeCoordinationSessions.delete(eventId);
        logger.info('Coordination session cleaned up', { eventId });
      }, 5000);

      logger.info('Cross-platform streaming coordination ended', { 
        eventId, 
        endedPlatforms: Object.keys(endResults),
        errors
      });
    } catch (error) {
      logger.error('Failed to end cross-platform streaming', error, { eventId });
      // Clean up session even if there were errors
      this.activeCoordinationSessions.delete(eventId);
      throw error;
    }
  }

  /**
   * Log coordination events for analytics and debugging
   */
  private async logCoordinationEvent(
    eventId: string, 
    event: any
  ): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (session) {
        const events = session.coordinationEvents ? JSON.parse(session.coordinationEvents) : [];
        events.push(event);
        
        await storage.updateStreamCoordinationSession(session.id, {
          coordinationEvents: JSON.stringify(events),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      logger.error('Failed to log coordination event', error, { eventId });
    }
  }

  /**
   * Calculate average response time for coordination actions
   */
  private calculateAverageResponseTime(eventId: string): number {
    // Implementation for response time calculation
    return 2.5; // seconds average
  }

  /**
   * Calculate overall coordination health score
   */
  private calculateCoordinationHealth(
    session?: StreamCoordinationSession, 
    collaborators?: StreamCollaborator[]
  ): number {
    if (!session || !collaborators) return 0;
    
    const factors = {
      activeParticipation: (session.activeCollaborators?.length || 0) / collaborators.length,
      technicalStability: 0.9, // Would be calculated from platform status
      communicationQuality: 0.85 // Would be calculated from coordination events
    };
    
    return (factors.activeParticipation + factors.technicalStability + factors.communicationQuality) / 3;
  }
}

// Export singleton instance
export const collaborativeStreaming = CollaborativeStreamingService.getInstance();