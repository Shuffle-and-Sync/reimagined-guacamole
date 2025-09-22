// Auth.js v5 Express.js integration routes
import { Router } from "express";
import { ExpressAuth } from "@auth/express";
import authConfig from "./auth.config";

const router = Router();

// Use proper Express.js integration for Auth.js
// This handles all Auth.js routes automatically and fixes UnknownAction errors
// Note: The router is already mounted at the app level, so we use "*" here
router.use("*", ExpressAuth({
  ...authConfig,
  // Proper Express.js configuration for custom domain
  basePath: "/api/auth", // Keep as /api/auth to match existing setup
  trustHost: true, // Trust X-Forwarded-Host header for domain detection
}));

export default router;
