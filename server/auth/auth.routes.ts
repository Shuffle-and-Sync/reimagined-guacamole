// Auth.js v5 Express.js integration routes
import { Router } from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./auth.config";

const router = Router();

// Use proper Express.js integration for Auth.js
// This handles all Auth.js routes automatically and fixes UnknownAction errors
// CRITICAL FIX: Use basePath "/" since router is mounted at "/api/auth"
router.use("*", ExpressAuth({
  ...authConfig,
  // FIXED: basePath "/" prevents double-path issue (/api/auth/api/auth)
  basePath: "/", // Router already mounted at /api/auth, so basePath should be "/"
  trustHost: true, // Trust X-Forwarded-Host header for domain detection
}));

export default router;
