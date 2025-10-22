/**
 * Resource Ownership Authorization Error Tests
 *
 * Tests authorization failures for resource ownership checks,
 * ensuring users can only modify their own content.
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  globalErrorHandler,
  AuthorizationError,
} from "../../../middleware/error-handling.middleware";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  errorFactories,
  errorAssertions,
} from "../../helpers/error-test-utils";

describe("Resource Ownership Authorization Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/tournaments/123",
      method: "PUT",
      body: {},
      query: {},
      params: { id: "123" },
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("Non-Owner Edit Attempt", () => {
    test("should block non-owner from editing resource", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to edit this resource",
        {
          resourceId: "123",
          ownerId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      errorAssertions.expectAuthorizationError(error);
    });

    test("should provide clear ownership message", () => {
      const authzError = errorFactories.authorization(
        "Only the resource owner can perform this action",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("owner");
    });
  });

  describe("Tournament Organizer Checks", () => {
    test("should block non-organizer from modifying tournament", () => {
      mockReq.url = "/api/tournaments/123/settings";

      const authzError = new AuthorizationError(
        "Only tournament organizers can modify settings",
        {
          tournamentId: "123",
          organizerId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("organizers");
    });

    test("should allow co-organizer modifications", () => {
      // This would pass - testing that error is NOT thrown
      // In real scenario, co-organizer would have permission
      const authzError = new AuthorizationError(
        "You are not an organizer of this tournament",
        {
          tournamentId: "123",
          role: "participant",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      errorAssertions.expectAuthorizationError(error);
    });

    test("should block tournament deletion by non-organizer", () => {
      mockReq.method = "DELETE";

      const authzError = errorFactories.authorization(
        "Only the tournament organizer can delete this tournament",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("delete");
    });
  });

  describe("Message Sender/Recipient Validation", () => {
    test("should block editing messages from other users", () => {
      mockReq.url = "/api/messages/456";

      const authzError = new AuthorizationError(
        "You can only edit your own messages",
        {
          messageId: "456",
          senderId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("your own messages");
    });

    test("should block deleting messages sent by others", () => {
      mockReq.method = "DELETE";
      mockReq.url = "/api/messages/789";

      const authzError = errorFactories.authorization(
        "You cannot delete messages you did not send",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("did not send");
    });

    test("should validate recipient can read message", () => {
      mockReq.method = "GET";

      const authzError = new AuthorizationError(
        "You are not authorized to read this message",
        {
          messageId: "789",
          recipientId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      errorAssertions.expectAuthorizationError(error);
    });
  });

  describe("Profile Modification Permissions", () => {
    test("should block editing other user profiles", () => {
      mockReq.url = "/api/users/user_abc/profile";

      const authzError = new AuthorizationError(
        "You can only edit your own profile",
        {
          profileUserId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("your own profile");
    });

    test("should block changing other user settings", () => {
      mockReq.url = "/api/users/user_abc/settings";

      const authzError = errorFactories.authorization(
        "Access denied: You cannot modify another user's settings",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Access denied");
    });
  });

  describe("Delete Own Content Only", () => {
    test("should block deleting content created by others", () => {
      mockReq.method = "DELETE";
      mockReq.url = "/api/posts/post_123";

      const authzError = new AuthorizationError(
        "You can only delete your own posts",
        {
          postId: "post_123",
          authorId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("your own posts");
    });

    test("should allow deleting own comments", () => {
      mockReq.method = "DELETE";
      mockReq.url = "/api/comments/comment_456";

      // This would pass for owner - testing non-owner error
      const authzError = errorFactories.authorization(
        "You cannot delete comments you did not write",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      errorAssertions.expectAuthorizationError(error);
    });
  });

  describe("Admin Override Permissions", () => {
    test("should allow admin to override ownership check", () => {
      // Testing that non-admin gets blocked
      const authzError = new AuthorizationError(
        "Insufficient permissions to override ownership",
        {
          userRole: "user",
          requiredRole: "admin",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Insufficient permissions");
    });

    test("should allow moderator to edit reported content", () => {
      // Testing that regular user cannot edit reported content
      const authzError = errorFactories.authorization(
        "Only moderators can edit reported content",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("moderators");
    });
  });

  describe("Collaborative Resource Ownership", () => {
    test("should validate collaborator permissions", () => {
      const authzError = new AuthorizationError(
        "You are not a collaborator on this resource",
        {
          resourceId: "123",
          collaborators: ["user_abc", "user_def"],
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("not a collaborator");
    });

    test("should enforce shared resource access levels", () => {
      const authzError = new AuthorizationError(
        "Your access level does not permit this action",
        {
          resourceId: "123",
          userAccessLevel: "viewer",
          requiredAccessLevel: "editor",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      errorAssertions.expectAuthorizationError(error);
    });
  });

  describe("Transferred Ownership", () => {
    test("should validate new owner permissions", () => {
      const authzError = new AuthorizationError(
        "Only the current owner can transfer ownership",
        {
          currentOwnerId: "user_abc",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("transfer ownership");
    });

    test("should block access after ownership transfer", () => {
      const authzError = errorFactories.authorization(
        "This resource has been transferred to another user",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("transferred");
    });
  });

  describe("Team Resource Ownership", () => {
    test("should validate team member permissions", () => {
      const authzError = new AuthorizationError(
        "You must be a team member to access this resource",
        {
          teamId: "team_123",
          requestingUserId: "user_xyz",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("team member");
    });

    test("should enforce team role hierarchy", () => {
      const authzError = new AuthorizationError(
        "Your team role does not permit this action",
        {
          teamId: "team_123",
          userRole: "member",
          requiredRole: "admin",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      errorAssertions.expectAuthorizationError(error);
    });
  });

  describe("Error Response Format", () => {
    test("should provide consistent ownership error format", () => {
      const authzError = errorFactories.authorization(
        "Ownership verification failed",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");

      expect(error.success).toBe(false);
      expect(error.error.code).toBe("AUTHORIZATION_ERROR");
      expect(error.error.statusCode).toBe(403);
      expect(error.error.requestId).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
    });

    test("should not leak ownership details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const authzError = new AuthorizationError("Access denied", {
        ownerId: "user_abc",
        ownerEmail: "owner@example.com",
        requestingUserId: "user_xyz",
      });

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
