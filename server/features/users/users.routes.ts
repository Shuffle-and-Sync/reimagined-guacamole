import { Router } from "express";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import {
  cacheStrategies,
  cacheInvalidation,
} from "../../middleware/cache.middleware";
import { assertRouteParam } from "../../shared/utils";
import {
  validateRequest,
  validateUserProfileUpdateSchema,
  validateSocialLinksSchema,
} from "../../validation";
import { friendsService } from "./friends.service";
import { usersService } from "./users.service";

const router = Router();

// Profile Management Routes
// Update user profile
router.patch(
  "/profile",
  isAuthenticated,
  validateRequest(validateUserProfileUpdateSchema),
  cacheInvalidation.user(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const updatedUser = await usersService.updateProfile(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      logger.error("Failed to update user profile", toLoggableError(error), {
        userId: getAuthUserId(authenticatedReq),
      });
      res.status(500).json({ message: "Failed to update profile" });
    }
  },
);

// Get user profile (for viewing other users' profiles)
router.get(
  "/profile/:userId?",
  isAuthenticated,
  cacheStrategies.userProfile(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId;

      const userProfile = await usersService.getUserProfile(
        currentUserId,
        targetUserId,
      );

      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(userProfile);
    } catch (error) {
      logger.error("Failed to fetch user profile", toLoggableError(error), {
        currentUserId: getAuthUserId(authenticatedReq),
        targetUserId: req.params.userId,
      });
      return res.status(500).json({ message: "Failed to fetch profile" });
    }
  },
);

// Social Links Routes
router.get(
  "/social-links/:userId?",
  isAuthenticated,
  cacheStrategies.userProfile(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId || currentUserId;

      const socialLinks = await usersService.getUserSocialLinks(targetUserId);
      res.json(socialLinks);
    } catch (error) {
      logger.error("Failed to fetch social links", toLoggableError(error), {
        userId: getAuthUserId(authenticatedReq),
      });
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  },
);

router.put(
  "/social-links",
  isAuthenticated,
  validateRequest(validateSocialLinksSchema),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const updatedLinks = await usersService.updateSocialLinks(
        userId,
        req.body,
      );
      res.json(updatedLinks);
    } catch (error) {
      logger.error("Failed to update social links", toLoggableError(error), {
        userId: getAuthUserId(authenticatedReq),
      });
      res.status(500).json({ message: "Failed to update social links" });
    }
  },
);

// Gaming Profiles Routes
router.get("/gaming-profiles/:userId?", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId || currentUserId;

    const gamingProfiles =
      await usersService.getUserGamingProfiles(targetUserId);
    res.json(gamingProfiles);
  } catch (error) {
    logger.error("Failed to fetch gaming profiles", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to fetch gaming profiles" });
  }
});

// User Settings Routes
router.get("/settings", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const settings = await usersService.getUserSettings(userId);
    res.json(settings);
  } catch (error) {
    logger.error("Failed to fetch user settings", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to fetch user settings" });
  }
});

router.put("/settings", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const updatedSettings = await usersService.updateUserSettings(
      userId,
      req.body,
    );
    res.json(updatedSettings);
  } catch (error) {
    logger.error("Failed to update user settings", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to update user settings" });
  }
});

// Data Export Route
router.get("/export-data", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const userData = await usersService.exportUserData(userId);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="user-data-${userId}.json"`,
    );
    res.json(userData);
  } catch (error) {
    logger.error("Failed to export user data", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to export user data" });
  }
});

// Account Deletion Route
router.delete("/account", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const success = await usersService.deleteUserAccount(userId);

    if (success) {
      // Clear authentication cookies
      res.clearCookie("authjs.session-token");
      res.clearCookie("authjs.callback-url");
      res.clearCookie("authjs.csrf-token");

      res.json({ message: "Account deleted successfully" });
    } else {
      res.status(404).json({ message: "User account not found" });
    }
  } catch (error) {
    logger.error("Failed to delete user account", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to delete account" });
  }
});

export { router as usersRoutes };

// Separate router for friends management (mounted at /api/friends)
export const friendsRouter = Router();

friendsRouter.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const friends = await friendsService.getFriends(userId);
    res.json(friends);
  } catch (error) {
    logger.error("Failed to fetch friends", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

friendsRouter.delete("/:id", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const id = assertRouteParam(req.params.id, "id");

    await friendsService.removeFriend(userId, id);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    logger.error("Failed to remove friend", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to remove friend" });
  }
});

// Separate router for friend requests (mounted at /api/friend-requests)
export const friendRequestsRouter = Router();

friendRequestsRouter.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const friendRequests = await friendsService.getFriendRequests(userId);
    res.json(friendRequests);
  } catch (error) {
    logger.error("Failed to fetch friend requests", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to fetch friend requests" });
  }
});

friendRequestsRouter.post("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const requesterId = getAuthUserId(authenticatedReq);
    const { addresseeId } = req.body;
    const friendship = await friendsService.sendFriendRequest(
      requesterId,
      addresseeId,
    );
    return res.status(201).json(friendship);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Addressee ID is required" ||
        error.message === "Cannot send friend request to yourself" ||
        error.message === "Friendship request already exists"
      ) {
        return res.status(400).json({ message: error.message });
      }
    }

    logger.error("Failed to send friend request", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({ message: "Failed to send friend request" });
  }
});

friendRequestsRouter.put("/:id", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const id = assertRouteParam(req.params.id, "id");
    const { status } = req.body;

    const friendship = await friendsService.respondToFriendRequest(id, status);
    return res.json(friendship);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid status") {
      return res.status(400).json({ message: error.message });
    }

    logger.error("Failed to respond to friend request", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res
      .status(500)
      .json({ message: "Failed to respond to friend request" });
  }
});

// Separate router for matchmaking (mounted at /api/matchmaking)
export const matchmakingRouter = Router();

matchmakingRouter.get("/preferences", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const preferences = await usersService.getMatchmakingPreferences(userId);
    res.json(preferences);
  } catch (error) {
    logger.error("Failed to fetch matchmaking preferences", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res
      .status(500)
      .json({ message: "Failed to fetch matchmaking preferences" });
  }
});

matchmakingRouter.put("/preferences", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const updatedPreferences = await usersService.updateMatchmakingPreferences(
      userId,
      req.body,
    );
    res.json(updatedPreferences);
  } catch (error) {
    logger.error("Failed to update matchmaking preferences", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res
      .status(500)
      .json({ message: "Failed to update matchmaking preferences" });
  }
});

matchmakingRouter.post("/find-players", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const players = await usersService.findPlayers(userId, req.body);
    res.json(players);
  } catch (error) {
    logger.error("Failed to find players", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Failed to find players" });
  }
});
