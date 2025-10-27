/**
 * BaseRules
 *
 * Common authorization rules that apply across all games.
 */

import { AuthorizationRule } from "../types";

/**
 * Turn-based action rule - players can only act during their turn
 */
export const turnBasedRule: AuthorizationRule = {
  name: "turn-based-action",
  priority: 100,
  match: (action, context) => {
    return action.startsWith("game.action.") && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Check if it's the player's turn
    const isPlayersTurn = state?.activePlayer === context.userId;

    if (!isPlayersTurn) {
      return {
        authorized: false,
        reason: "Not your turn",
      };
    }

    return { authorized: true };
  },
};

/**
 * Hand visibility rule - players can only see their own hand
 */
export const handVisibilityRule: AuthorizationRule = {
  name: "hand-visibility",
  priority: 90,
  match: (action, context) => {
    return action === "game.view.hand";
  },
  authorize: (action, context, state) => {
    const requestedPlayerId = state?.requestedPlayerId;

    // Players can only see their own hand, moderators can see any
    if (requestedPlayerId !== context.userId && context.role !== "moderator") {
      return {
        authorized: false,
        reason: "Cannot view opponent hand",
      };
    }

    return { authorized: true };
  },
};

/**
 * Game phase rule - certain actions only allowed in certain phases
 */
export const gamePhaseRule: AuthorizationRule = {
  name: "game-phase-restriction",
  priority: 95,
  match: (action, context) => {
    return action.startsWith("game.action.") && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Extract action type from full action string
    const actionType = action.replace("game.action.", "");

    // Check if current phase allows this action
    if (state?.currentPhase?.allowedActions) {
      const isAllowed = state.currentPhase.allowedActions.includes(actionType);

      if (!isAllowed) {
        return {
          authorized: false,
          reason: `Action ${actionType} not allowed in ${state.currentPhase.name} phase`,
        };
      }
    }

    return { authorized: true };
  },
};

/**
 * Player count rule - ensure game has correct number of players
 */
export const playerCountRule: AuthorizationRule = {
  name: "player-count-check",
  priority: 80,
  match: (action, context) => {
    return action === "game.action.start" && context.role === "player";
  },
  authorize: (action, context, state) => {
    if (!state?.players || !Array.isArray(state.players)) {
      return {
        authorized: false,
        reason: "Invalid game state: no players",
      };
    }

    const minPlayers = state.config?.minPlayers || 2;
    const maxPlayers = state.config?.maxPlayers || 4;

    if (state.players.length < minPlayers) {
      return {
        authorized: false,
        reason: `Need at least ${minPlayers} players to start`,
      };
    }

    if (state.players.length > maxPlayers) {
      return {
        authorized: false,
        reason: `Maximum ${maxPlayers} players allowed`,
      };
    }

    return { authorized: true };
  },
};

/**
 * Game state rule - game must be in active state for actions
 */
export const gameStateRule: AuthorizationRule = {
  name: "game-state-check",
  priority: 85,
  match: (action, context) => {
    return action.startsWith("game.action.") && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Skip check for game start action
    if (action === "game.action.start") {
      return { authorized: true };
    }

    const gameStatus = state?.status || state?.state;

    if (gameStatus !== "active" && gameStatus !== "in_progress") {
      return {
        authorized: false,
        reason: `Game is not active (current status: ${gameStatus})`,
      };
    }

    return { authorized: true };
  },
};

/**
 * Resource ownership rule - players can only modify their own resources
 */
export const resourceOwnershipRule: AuthorizationRule = {
  name: "resource-ownership",
  priority: 75,
  match: (action, context) => {
    return (
      (action.startsWith("game.action.") ||
        action.startsWith("game.update.")) &&
      context.role === "player"
    );
  },
  authorize: (action, context, state) => {
    // Extract target player from state if present
    const targetPlayerId = state?.targetPlayerId || state?.ownerId;

    // If there's a target player specified and it's not the current user
    if (targetPlayerId && targetPlayerId !== context.userId) {
      return {
        authorized: false,
        reason: "Cannot modify another player's resources",
      };
    }

    return { authorized: true };
  },
};

/**
 * All base rules
 */
export const baseRules: AuthorizationRule[] = [
  turnBasedRule,
  handVisibilityRule,
  gamePhaseRule,
  playerCountRule,
  gameStateRule,
  resourceOwnershipRule,
];
