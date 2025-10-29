/**
 * Matching Services
 * Exports all matching services for easy importing
 */

// Core orchestrator
export { realTimeMatchingCore } from "./real-time-matching-core.service";

// Specialized services
export { matchingCache } from "./matching-cache.service";
export { matchingMLScorer } from "./matching-ml-scorer.service";
export { matchingRecommendations } from "./matching-recommendations.service";

// Types
export * from "./matching-types";

// Backwards compatibility alias
export { realTimeMatchingCore as realtimeMatchingAPI } from "./real-time-matching-core.service";
