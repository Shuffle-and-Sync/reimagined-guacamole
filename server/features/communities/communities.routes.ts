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
import { communitiesService } from "./communities.service";

const router = Router();

// Get all communities
router.get("/", cacheStrategies.community(), async (req, res) => {
  try {
    const communities = await communitiesService.getAllCommunities();
    res.json(communities);
  } catch (error) {
    logger.error(
      "Failed to fetch communities",
      toLoggableError(error),
    );
    res.status(500).json({ message: "Failed to fetch communities" });
  }
});

// Get specific community
router.get("/:id", cacheStrategies.community(), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Community ID is required" });
    }

    const community = await communitiesService.getCommunity(id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    return res.json(community);
  } catch (error) {
    logger.error(
      "Failed to fetch community",
      toLoggableError(error),
      { id: req.params.id },
    );
    return res.status(500).json({ message: "Failed to fetch community" });
  }
});

export { router as communitiesRoutes };

// Separate router for user community management (mounted at /api/user/communities)
export const userCommunitiesRouter = Router();

// Join a community
userCommunitiesRouter.post(
  "/:communityId/join",
  isAuthenticated,
  cacheInvalidation.community(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { communityId } = req.params;

      if (!communityId) {
        return res.status(400).json({ message: "Community ID is required" });
      }

      const userCommunity = await communitiesService.joinCommunity(
        userId,
        communityId,
      );
      return res.json(userCommunity);
    } catch (error) {
      if (error instanceof Error && error.message === "Community not found") {
        return res.status(404).json({ message: "Community not found" });
      }

      logger.error(
        "Failed to join community",
        toLoggableError(error),
        {
          userId: getAuthUserId(authenticatedReq),
          communityId: req.params.communityId,
        },
      );
      return res.status(500).json({ message: "Failed to join community" });
    }
  },
);

// Set primary community
userCommunitiesRouter.post(
  "/:communityId/set-primary",
  isAuthenticated,
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { communityId } = req.params;

      if (!communityId) {
        return res.status(400).json({ message: "Community ID is required" });
      }

      await communitiesService.setPrimaryCommunity(userId, communityId);
      return res.json({ success: true });
    } catch (error) {
      logger.error(
        "Failed to set primary community",
        toLoggableError(error),
        {
          userId: getAuthUserId(authenticatedReq),
          communityId: req.params.communityId,
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to set primary community" });
    }
  },
);

// Theme preferences router (mounted at /api/user/theme-preferences)
export const themePreferencesRouter = Router();

// Get theme preferences
themePreferencesRouter.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const preferences =
      await communitiesService.getUserThemePreferences(userId);
    res.json(preferences);
  } catch (error) {
    logger.error(
      "Failed to fetch theme preferences",
      toLoggableError(error),
      {
        userId: getAuthUserId(authenticatedReq),
      },
    );
    res.status(500).json({ message: "Failed to fetch theme preferences" });
  }
});

// Update theme preferences
themePreferencesRouter.post("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const { communityId, themeMode, customColors } = req.body;

    const preference = await communitiesService.updateThemePreferences(userId, {
      communityId,
      themeMode,
      customColors,
    });

    res.json(preference);
  } catch (error) {
    logger.error(
      "Failed to update theme preferences",
      toLoggableError(error),
      {
        userId: getAuthUserId(authenticatedReq),
      },
    );
    res.status(500).json({ message: "Failed to update theme preferences" });
  }
});
