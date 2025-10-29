/**
 * Facebook API Services
 * Exports all Facebook services for easy importing
 */

// Core orchestrator
export { facebookAPI } from "./facebook-api-core.service";

// Specialized services
export { facebookAPIClient } from "./facebook-api-client.service";
export { facebookPageService } from "./facebook-page.service";
export { facebookStreamService } from "./facebook-stream.service";

// Types
export * from "./facebook-types";
