/**
 * Forum Routes
 * Handles forum posts, replies, and likes
 */

import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { logger } from "../logger";
import { storage } from "../storage";
import { assertRouteParam } from "../shared/utils";
import { errors, errorHandlingMiddleware } from "../middleware/error-handling.middleware";

const { asyncHandler } = errorHandlingMiddleware;
const { NotFoundError, ValidationError, AuthorizationError } = errors;

const router = Router();

// Get forum posts
router.get(
  "/posts",
  asyncHandler(async (req, res) => {
    const { communityId, category, limit, offset } = req.query;

    if (!communityId) {
      throw new ValidationError("Community ID is required");
    }

    const posts = await storage.getForumPosts(communityId as string, {
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.json(posts);
  }),
);

// Get specific forum post
router.get(
  "/posts/:id",
  asyncHandler(async (req, res) => {
    const postId = assertRouteParam(req.params.id, "id");
    const userId = req.query.userId as string;

    const post = await storage.getForumPost(postId, userId);
    if (!post) {
      throw new NotFoundError("Forum post");
    }

    return res.json(post);
  }),
);

// Create forum post
router.post(
  "/posts",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const postData = { ...req.body, authorId: userId };

    const post = await storage.createForumPost(postData);
    return res.json(post);
  }),
);

// Update forum post
router.put(
  "/posts/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const postId = assertRouteParam(req.params.id, "id");
    const userId = getAuthUserId(authenticatedReq);

    // Check if user owns the post
    const existingPost = await storage.getForumPost(postId);
    if (!existingPost) {
      throw new NotFoundError("Forum post");
    }
    if (existingPost.authorId !== userId) {
      throw new AuthorizationError("Not authorized to edit this post");
    }

    const updatedPost = await storage.updateForumPost(postId, req.body);
    return res.json(updatedPost);
  }),
);

// Delete forum post
router.delete(
  "/posts/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const postId = assertRouteParam(req.params.id, "id");
    const userId = getAuthUserId(authenticatedReq);

    // Check if user owns the post
    const existingPost = await storage.getForumPost(postId);
    if (!existingPost) {
      throw new NotFoundError("Forum post");
    }
    if (existingPost.authorId !== userId) {
      throw new AuthorizationError("Not authorized to delete this post");
    }

    await storage.deleteForumPost(postId);
    return res.json({ success: true });
  }),
);

// Like forum post
router.post(
  "/posts/:id/like",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const postId = assertRouteParam(req.params.id, "id");
    const userId = getAuthUserId(authenticatedReq);

    await storage.likeForumPost(postId, userId);
    return res.json({ success: true });
  }),
);

// Unlike forum post
router.delete(
  "/posts/:id/like",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const postId = assertRouteParam(req.params.id, "id");
    const userId = getAuthUserId(authenticatedReq);

    await storage.unlikeForumPost(postId, userId);
    return res.json({ success: true });
  }),
);

// Get forum post replies
router.get(
  "/posts/:id/replies",
  asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.query.userId as string;

    const replies = await storage.getForumReplies(postId, userId);
    return res.json(replies);
  }),
);

// Create forum reply
router.post(
  "/posts/:id/replies",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const postId = req.params.id;
    const userId = getAuthUserId(authenticatedReq);
    const replyData = { ...req.body, postId, authorId: userId };

    const reply = await storage.createForumReply(replyData);
    return res.json(reply);
  }),
);

// Like forum reply
router.post(
  "/replies/:id/like",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const replyId = assertRouteParam(req.params.id, "id");
    const userId = getAuthUserId(authenticatedReq);

    await storage.likeForumReply(replyId, userId);
    return res.json({ success: true });
  }),
);

// Unlike forum reply
router.delete(
  "/replies/:id/like",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const replyId = assertRouteParam(req.params.id, "id");
    const userId = getAuthUserId(authenticatedReq);

    await storage.unlikeForumReply(replyId, userId);
    return res.json({ success: true });
  }),
);

export default router;
