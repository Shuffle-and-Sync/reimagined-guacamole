import { Router } from "express";
import collaboratorsRouter from "./collaborators";
import coordinationRouter from "./coordination";
import eventsRouter from "./events";
import suggestionsRouter from "./suggestions";

const router = Router();

/**
 * Collaborative Streaming Routes
 *
 * This module handles all routes related to collaborative streaming features:
 * - Stream event creation and management (events.ts)
 * - Collaborator management (collaborators.ts)
 * - Coordination session handling (coordination.ts)
 * - Collaboration suggestions (suggestions.ts)
 *
 * All routes are prefixed with /api/collaborative-streams in the main app
 */

// Mount stream events routes
router.use("/", eventsRouter);

// Mount suggestions routes (must come before collaborators to avoid route conflict)
router.use("/", suggestionsRouter);

// Mount collaborators routes
router.use("/", collaboratorsRouter);

// Mount coordination routes
router.use("/", coordinationRouter);

export default router;
