/**
 * Shared types for Streaming Services
 */

import type {
  CollaborativeStreamEvent,
  StreamCollaborator,
  StreamCoordinationSession,
} from "@shared/schema";

export interface CollaborationSuggestions {
  suggestedCollaborators: unknown[];
  strategicRecommendations: string[];
  optimalScheduling: unknown;
}

export interface CoordinationStatus {
  session: StreamCoordinationSession | null;
  currentPhase: string;
  activeCollaborators: StreamCollaborator[];
  platformStatuses: Record<string, unknown>;
  health: {
    overallHealth: string;
    averageResponseTime: number;
    lastActivityTime: Date | null;
  };
}

export interface TimezoneCoverage {
  primaryTimezone: string;
  coverage: string;
  suggestedAlternatives: string[];
}

export interface OptimalScheduling {
  recommendedStartTime: Date;
  timezoneCoverage: TimezoneCoverage;
  conflictWarnings: string[];
  optimalDuration: number | null;
}

export interface PlatformStreamResult {
  streamId?: string;
  status: string;
  channelId?: string;
  message?: string;
  error?: string;
}

export {
  CollaborativeStreamEvent,
  StreamCollaborator,
  StreamCoordinationSession,
};
