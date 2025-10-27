/**
 * AuthorizationMiddleware
 *
 * Express middleware for authorization in game requests.
 */

import { AuthorizationManager } from "./AuthorizationManager";
import {
  AuthContext,
  GameRequest,
  NextFunction,
  UnauthorizedError,
} from "./types";

export class AuthorizationMiddleware {
  constructor(private authManager: AuthorizationManager) {}

  /**
   * Handle authorization for a game request
   */
  async handle(
    request: GameRequest,
    context: AuthContext,
    next: NextFunction,
  ): Promise<any> {
    // Extract action from request
    const action = this.getActionFromRequest(request);

    // Get current game state (this would be retrieved from state manager in real implementation)
    const state = await this.getGameState(request.gameId);

    // Authorize
    const authResult = await this.authManager.authorize(action, context, state);

    if (!authResult.authorized) {
      throw new UnauthorizedError(
        authResult.reason || "Unauthorized",
        "UNAUTHORIZED",
        {
          action,
          gameId: request.gameId,
          userId: context.userId,
          requiredPermissions: authResult.requiredPermissions,
        },
      );
    }

    // Proceed to next middleware
    return next(request, context);
  }

  /**
   * Express middleware wrapper
   */
  expressMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        // Extract context from request (would be populated by auth middleware)
        const context: AuthContext = this.extractAuthContext(req);

        // Extract game request
        const gameRequest: GameRequest = {
          gameId: req.params.gameId || req.body?.gameId,
          action: req.body?.action || this.inferActionFromRequest(req),
          payload: req.body,
          timestamp: Date.now(),
        };

        // Authorize
        await this.handle(gameRequest, context, async () => {
          // Continue with Express next()
          next();
          return Promise.resolve();
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          res.status(403).json({
            error: error.message,
            code: error.code,
            details: error.details,
          });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Extract action from request
   */
  private getActionFromRequest(request: GameRequest): string {
    return request.action || "unknown";
  }

  /**
   * Get game state (stub - should integrate with actual state manager)
   */
  private async getGameState(gameId: string): Promise<any> {
    // This is a placeholder - in real implementation, this would:
    // 1. Use StateManager to get current game state
    // 2. Return the actual game state object
    return {
      gameId,
      // Mock state for now
      activePlayer: null,
      phase: "setup",
    };
  }

  /**
   * Extract auth context from Express request
   */
  private extractAuthContext(req: any): AuthContext {
    // In real implementation, this would extract from:
    // - req.user (from auth middleware)
    // - req.session
    // - req.headers
    return {
      userId: req.user?.id || req.session?.userId || "anonymous",
      sessionId: req.sessionID || req.session?.id || "no-session",
      gameId: req.params.gameId || req.body?.gameId || "unknown",
      role: (req.user?.role as any) || "spectator",
      permissions: req.user?.permissions || [],
      metadata: {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    };
  }

  /**
   * Infer action from Express request method and path
   */
  private inferActionFromRequest(req: any): string {
    const method = req.method.toLowerCase();
    const path = req.path;

    // Map HTTP methods to actions
    if (method === "get") {
      return `game.view.${this.extractResourceFromPath(path)}`;
    } else if (method === "post") {
      return `game.action.${this.extractResourceFromPath(path)}`;
    } else if (method === "put" || method === "patch") {
      return `game.update.${this.extractResourceFromPath(path)}`;
    } else if (method === "delete") {
      return `game.delete.${this.extractResourceFromPath(path)}`;
    }

    return "game.unknown";
  }

  /**
   * Extract resource name from path
   */
  private extractResourceFromPath(path: string): string {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }
}
