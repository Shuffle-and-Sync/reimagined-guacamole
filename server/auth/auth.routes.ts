// Auth.js v5 Express.js integration routes
import { Router } from "express";
import { Auth } from "@auth/core";
import authConfig from "./auth.config";

const router = Router();

// Handle all Auth.js routes
router.all("/api/auth/*", async (req, res) => {
  try {
    // Use AUTH_URL if available, otherwise build from forwarded headers
    const base = process.env.AUTH_URL || 
      `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`;
    const url = `${base}${req.originalUrl}`;
    
    // Create Auth.js request
    const authRequest = new Request(url, {
      method: req.method,
      headers: req.headers as any,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    // Handle the request with Auth.js
    const response = await Auth(authRequest, authConfig);
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Set status and send response
    res.status(response.status);
    
    if (response.body) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Auth.js error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
});

export default router;
