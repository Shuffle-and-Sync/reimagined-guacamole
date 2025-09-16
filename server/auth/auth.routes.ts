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
    
    // Create Auth.js request with proper body handling for form data
    let body: string | undefined = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.body && typeof req.body === 'object') {
        // Convert Express parsed body back to form data
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          if (typeof value === 'string') {
            params.append(key, value);
          }
        }
        body = params.toString();
      }
    }

    const authRequest = new Request(url, {
      method: req.method,
      headers: {
        ...req.headers,
        'content-type': req.method === 'POST' ? 'application/x-www-form-urlencoded' : req.headers['content-type']
      } as any,
      body,
    });

    // Handle the request with Auth.js
    const response = await Auth(authRequest, authConfig);
    
    // Copy response headers, handling multiple Set-Cookie headers properly
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Handle Set-Cookie specially to preserve multiple values
        const cookies = response.headers.getSetCookie?.() || [value];
        res.setHeader('set-cookie', cookies);
      } else {
        res.setHeader(key, value);
      }
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
