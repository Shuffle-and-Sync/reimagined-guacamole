import { Router } from "express";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  requireHybridAuth,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import {
  generateAccessTokenJWT,
  generateRefreshTokenJWT,
  verifyRefreshTokenJWT,
  generateRefreshTokenId,
  TOKEN_EXPIRY,
} from "../../auth/tokens";
import { logger } from "../../logger";
import { authRateLimit, tokenRevocationLimiter } from "../../rate-limiting";
import { storage } from "../../storage";
import { validateRequest } from "../../validation";
import { refreshTokenSchema, revokeTokenSchema } from "./middleware";

const router = Router();

// Refresh access token
router.post(
  "/refresh",
  authRateLimit,
  validateRequest(refreshTokenSchema),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      // Verify the refresh token JWT
      const { valid, payload, error } =
        await verifyRefreshTokenJWT(refreshToken);
      if (!valid || !payload) {
        logger.warn("Invalid refresh token attempted", { error, ip: req.ip });
        return res
          .status(401)
          .json({ message: "Invalid or expired refresh token" });
      }

      // Check if refresh token exists in database and is not revoked
      const tokenRecord = await storage.getRefreshToken(payload.jti);
      if (!tokenRecord) {
        logger.warn("Refresh token not found in database", {
          tokenId: payload.jti,
          ip: req.ip,
        });
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // CRITICAL SECURITY: Check if token was already revoked (reuse detection)
      if (tokenRecord.isRevoked) {
        logger.error(
          "SECURITY ALERT: Refresh token reuse detected - revoking all user tokens",
          {
            userId: payload.sub,
            tokenId: payload.jti,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          },
        );

        // Revoke ALL user's refresh tokens immediately
        await storage.revokeAllUserRefreshTokens(payload.sub);

        // Log security incident to audit trail
        await storage.createAuthAuditLog({
          userId: payload.sub,
          eventType: "logout", // Closest equivalent to forced logout due to security
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          isSuccessful: false,
          failureReason: "security_policy", // Use valid enum value instead
          details: JSON.stringify({
            tokenId: payload.jti,
            revokedAllTokens: true,
          }),
        });
        return res.status(401).json({
          message: "Security violation detected - all tokens revoked",
        });
      }

      // Get user details
      const user = await storage.getUser(payload.sub);
      if (!user) {
        logger.warn("User not found for refresh token", {
          userId: payload.sub,
          ip: req.ip,
        });
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.email) {
        logger.warn("User has no email for refresh token", {
          userId: payload.sub,
          ip: req.ip,
        });
        return res.status(401).json({ message: "User has no email address" });
      }

      // CRITICAL SECURITY: Implement refresh token rotation
      // 1. Generate new refresh token ID and JWT
      const newRefreshTokenId = generateRefreshTokenId();
      const newRefreshTokenJWT = await generateRefreshTokenJWT(
        user.id,
        user.email,
        newRefreshTokenId,
      );

      // 2. Generate new access token
      const newAccessToken = await generateAccessTokenJWT(user.id, user.email);

      // 3. Atomic operation: Create new refresh token and revoke old one
      try {
        // Create new refresh token record
        const newRefreshTokenData = {
          id: newRefreshTokenId,
          userId: user.id,
          token: newRefreshTokenJWT,
          userAgent: req.headers["user-agent"] || null,
          ipAddress: req.ip || "unknown",
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000),
        };

        await storage.createRefreshToken(newRefreshTokenData);

        // Revoke the old refresh token
        await storage.revokeRefreshToken(payload.jti);

        // Log successful token refresh to audit trail
        await storage.createAuthAuditLog({
          userId: user.id,
          eventType: "login_success", // Token refresh is maintaining session
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          isSuccessful: true,
          details: JSON.stringify({
            oldTokenId: payload.jti,
            newTokenId: newRefreshTokenId,
            refreshType: "token_rotation",
          }),
        });

        logger.info("Refresh token rotation completed successfully", {
          userId: user.id,
          oldTokenId: payload.jti,
          newTokenId: newRefreshTokenId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });

        // Return both new access token and new refresh token
        return res.json({
          accessToken: newAccessToken,
          refreshToken: newRefreshTokenJWT,
          expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
          tokenType: "Bearer",
        });
      } catch (rotationError) {
        logger.error(
          "Refresh token rotation failed",
          toLoggableError(rotationError),
          {
            userId: user.id,
            tokenId: payload.jti,
            ip: req.ip,
          },
        );

        // If rotation fails, revoke the old token for security
        await storage.revokeRefreshToken(payload.jti);
        return res
          .status(500)
          .json({ message: "Token rotation failed - please login again" });
      }
    } catch (error) {
      logger.error("Token refresh failed", toLoggableError(error), {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });
      return res.status(500).json({ message: "Failed to refresh token" });
    }
  },
);

// Revoke a single refresh token
router.post(
  "/revoke",
  requireHybridAuth,
  authRateLimit,
  validateRequest(revokeTokenSchema),
  async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      // Verify and get refresh token payload
      const { valid, payload } = await verifyRefreshTokenJWT(refreshToken);
      if (!valid || !payload) {
        return res.status(400).json({ message: "Invalid refresh token" });
      }

      // Ensure user can only revoke their own tokens
      if (payload.sub !== userId) {
        return res
          .status(403)
          .json({ message: "Cannot revoke another user's token" });
      }

      // Revoke the refresh token
      await storage.revokeRefreshToken(payload.jti);

      logger.info("Refresh token revoked successfully", {
        userId,
        tokenId: payload.jti,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });

      return res.json({ message: "Token revoked successfully" });
    } catch (error) {
      logger.error("Token revocation failed", toLoggableError(error), {
        userId: getAuthUserId(req as AuthenticatedRequest),
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });
      return res.status(500).json({ message: "Failed to revoke token" });
    }
  },
);

// Revoke all refresh tokens for user
router.post(
  "/revoke-all",
  requireHybridAuth,
  tokenRevocationLimiter, // Dedicated strict rate limiter for token revocation
  async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);

      // Get count of active tokens before revoking
      const activeTokens = await storage.getUserActiveRefreshTokens(userId);
      const tokenCount = activeTokens.length;

      // Revoke all user's refresh tokens
      await storage.revokeAllUserRefreshTokens(userId);

      logger.info("All refresh tokens revoked for user", {
        userId,
        revokedTokenCount: tokenCount,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });

      return res.json({
        message: "All tokens revoked successfully",
        revokedTokenCount: tokenCount,
      });
    } catch (error) {
      logger.error("All tokens revocation failed", toLoggableError(error), {
        userId: getAuthUserId(req as AuthenticatedRequest),
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });
      return res.status(500).json({ message: "Failed to revoke all tokens" });
    }
  },
);

// List all active refresh tokens
router.get("/tokens", requireHybridAuth, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);

    // Get user's active refresh tokens
    const activeTokens = await storage.getUserActiveRefreshTokens(userId);

    // Format tokens for response (hide sensitive data)
    const tokenList = activeTokens.map((token) => ({
      id: token.id,
      userAgent: (() => {
        try {
          const deviceInfo = JSON.parse(token.deviceInfo || "{}");
          return deviceInfo.userAgent || "Unknown";
        } catch {
          return "Unknown";
        }
      })(),
      ipAddress: token.ipAddress,
      createdAt: token.createdAt,
      lastUsed: token.lastUsed,
      expiresAt: token.expiresAt,
      isCurrentSession: (() => {
        try {
          const deviceInfo = JSON.parse(token.deviceInfo || "{}");
          return req.headers["user-agent"] === deviceInfo.userAgent;
        } catch {
          return false;
        }
      })(),
    }));

    return res.json({
      tokens: tokenList,
      totalActive: tokenList.length,
    });
  } catch (error) {
    logger.error("Failed to fetch user tokens", toLoggableError(error), {
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res.status(500).json({ message: "Failed to fetch active tokens" });
  }
});

export default router;
