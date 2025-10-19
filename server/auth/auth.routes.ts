// Auth.js v5 Express.js integration routes
import { type Router } from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./auth.config";

// Export ExpressAuth middleware directly instead of using a Router
// This ensures proper path matching for all Auth.js routes
// When mounted at /api/auth, ExpressAuth will handle:
// - /api/auth/signin, /api/auth/signout
// - /api/auth/callback/google, /api/auth/callback/[provider]
// - /api/auth/session, /api/auth/providers
// - /api/auth/csrf
export default ExpressAuth(authConfig);
