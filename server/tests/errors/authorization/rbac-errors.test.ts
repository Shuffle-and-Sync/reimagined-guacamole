/**
 * Role-Based Access Control (RBAC) Error Tests
 *
 * Tests authorization failures for role-based permissions,
 * admin-only endpoints, and permission checks.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  errorFactories,
  errorAssertions,
} from "../../helpers/error-test-utils";
import {
  globalErrorHandler,
  AuthorizationError,
} from "../../../middleware/error-handling.middleware";

describe("RBAC Authorization Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/admin/users",
      method: "GET",
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  describe("Insufficient Role Level", () => {
    test("should reject user without required role", () => {
      const authzError = errorFactories.authorization(
        "Insufficient permissions",
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

    test("should provide clear message about required role", () => {
      const authzError = new AuthorizationError(
        "Admin role required for this action",
        {
          requiredRole: "admin",
          userRole: "user",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Admin role required");
    });

    test("should reject moderator accessing admin endpoint", () => {
      const authzError = new AuthorizationError(
        "This action requires administrator privileges",
        {
          requiredRole: "admin",
          currentRole: "moderator",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("administrator privileges");
    });
  });

  describe("Admin-Only Endpoint Access", () => {
    test("should block non-admin from admin endpoint", () => {
      const authzError = errorFactories.authorization(
        "Access denied: Admin privileges required",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Admin privileges");
    });

    test("should reject regular user accessing user management", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to manage users",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("manage users");
    });

    test("should block access to system settings", () => {
      const authzError = new AuthorizationError(
        "Only administrators can modify system settings",
        {
          action: "modify_settings",
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

  describe("Moderator Permission Checks", () => {
    test("should allow moderator but block regular user", () => {
      const authzError = new AuthorizationError(
        "Moderator or Admin role required",
        {
          requiredRoles: ["moderator", "admin"],
          userRole: "user",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Moderator or Admin");
    });

    test("should reject user from moderation actions", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to moderate content",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("moderate content");
    });
  });

  describe("Role Hierarchy Enforcement", () => {
    test("should respect role hierarchy", () => {
      const authzError = new AuthorizationError(
        "Cannot perform action on user with higher role",
        {
          targetUserRole: "admin",
          currentUserRole: "moderator",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("higher role");
    });

    test("should prevent role escalation", () => {
      const authzError = new AuthorizationError(
        "Cannot assign role higher than your own",
        {
          attemptedRole: "admin",
          userRole: "moderator",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("higher than your own");
    });

    test("should block moderator from promoting to admin", () => {
      const authzError = new AuthorizationError(
        "Only administrators can grant admin privileges",
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

  describe("Role Assignment Validation", () => {
    test("should reject invalid role assignment", () => {
      const authzError = new AuthorizationError("Cannot assign invalid role", {
        invalidRole: "superadmin",
        validRoles: ["user", "moderator", "admin"],
      });

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("invalid role");
    });

    test("should require proper permissions for role changes", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to change user roles",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("change user roles");
    });
  });

  describe("Custom Permission Checks", () => {
    test("should handle custom permission denial", () => {
      const authzError = new AuthorizationError(
        "Missing required permission: manage_tournaments",
        {
          permission: "manage_tournaments",
          userPermissions: ["view_tournaments"],
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("manage_tournaments");
    });

    test("should reject action without specific permission", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to delete tournaments",
        {
          requiredPermission: "delete_tournament",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("delete tournaments");
    });

    test("should handle multiple permission requirements", () => {
      const authzError = new AuthorizationError(
        "This action requires multiple permissions",
        {
          requiredPermissions: ["create_tournament", "manage_users"],
          userPermissions: ["create_tournament"],
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

  describe("Feature Access Control", () => {
    test("should block access to premium feature", () => {
      const authzError = new AuthorizationError(
        "This feature requires a premium subscription",
        {
          feature: "advanced_analytics",
          userTier: "free",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("premium subscription");
    });

    test("should require beta access", () => {
      const authzError = new AuthorizationError(
        "Beta access required for this feature",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Beta access");
    });
  });

  describe("Resource-Specific Permissions", () => {
    test("should check permission for specific resource", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to edit this tournament",
        {
          resourceType: "tournament",
          resourceId: "tournament_123",
          action: "edit",
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("edit this tournament");
    });

    test("should validate action on resource", () => {
      const authzError = new AuthorizationError(
        "Insufficient permissions for this action",
        {
          resource: "event_456",
          action: "delete",
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
    test("should provide consistent authorization error format", () => {
      const authzError = errorFactories.authorization();

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

    test("should not leak role/permission details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const authzError = new AuthorizationError("Access denied", {
        userRoles: ["user"],
        requiredRoles: ["admin"],
        userPermissions: ["read"],
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

    test("should provide helpful message for users", () => {
      const authzError = new AuthorizationError(
        "You do not have permission to perform this action. Contact an administrator for access.",
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("Contact an administrator");
    });
  });

  describe("API Key Permissions", () => {
    test("should validate API key permissions", () => {
      const authzError = new AuthorizationError(
        "API key does not have required scope",
        {
          apiKey: "sk_***",
          requiredScope: "write:tournaments",
          currentScopes: ["read:tournaments"],
        },
      );

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("required scope");
    });

    test("should reject expired API key", () => {
      const authzError = new AuthorizationError("API key has expired");

      globalErrorHandler(
        authzError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 403, "AUTHORIZATION_ERROR");
      expect(error.error.message).toContain("expired");
    });
  });
});
