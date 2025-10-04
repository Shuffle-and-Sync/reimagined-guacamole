// Auth.js v5 Express.js integration routes
import { Router } from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./auth.config";

const router = Router();

// Use proper Express.js integration for Auth.js
// This handles all Auth.js routes automatically and fixes UnknownAction errors
// CRITICAL FIX: Use basePath "/api/auth" for proper URL resolution in Cloud Run
router.use("*", ExpressAuth({
  ...authConfig,
  // basePath must be the full path where auth routes are mounted
  // This ensures Auth.js correctly resolves callback URLs and redirects
  basePath: "/api/auth",
}));

export default router;
