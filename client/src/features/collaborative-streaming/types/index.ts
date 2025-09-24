// Collaborative streaming types
export type {
  CollaborativeStreamEvent,
  StreamCollaborator, 
  StreamCoordinationSession,
  InsertCollaborativeStreamEvent,
  InsertStreamCollaborator,
  InsertStreamCoordinationSession
} from '@shared/schema';

// Frontend-specific types for UI components
export interface StreamEventFormData {
  title: string;
  description?: string;
  scheduledStartTime: Date;
  estimatedDuration: number;
  communityId?: string;
  streamingPlatforms: string[];
  contentType: string;
  targetAudience: string;
  maxCollaborators?: number;
  requiresApproval: boolean;
  isPrivate: boolean;
  tags: string[];
}

export interface CollaboratorInviteData {
  userId?: string;
  email?: string;
  role: 'host' | 'co_host' | 'guest' | 'moderator';
  platformHandles?: Record<string, string>;
  streamingCapabilities: string[];
  message?: string;
}

export interface CoordinationPhase {
  name: 'preparation' | 'live' | 'break' | 'wrap_up' | 'ended';
  displayName: string;
  description: string;
  allowedTransitions: string[];
}

export interface StreamMetrics {
  totalViewers: number;
  viewersByPlatform: Record<string, number>;
  peakViewers: number;
  streamDuration: number;
  chatActivity: number;
  lastUpdated: Date;
}

export interface CoordinationEvent {
  id: string;
  type: 'phase_change' | 'collaborator_joined' | 'collaborator_left' | 'platform_status' | 'message';
  timestamp: Date;
  data: any;
  userId?: string;
  message?: string;
}

// Coordination status types
export interface CoordinationStatus {
  eventId: string;
  currentPhase: 'preparation' | 'live' | 'break' | 'wrap_up' | 'ended';
  actualStartTime?: string;
  activeCollaborators?: string[];
  currentHost?: string;
  streamMetrics?: {
    totalViewers: number;
    platformViewers: Record<string, number>;
    duration: number;
  };
}

// Collaboration suggestion types  
export interface CollaborationSuggestion {
  id: string;
  type: 'optimal_timing' | 'content_synergy' | 'audience_overlap' | 'platform_strategy';
  title: string;
  description: string;
  confidence: number;
  estimatedImpact: 'low' | 'medium' | 'high';
  actionable: boolean;
}