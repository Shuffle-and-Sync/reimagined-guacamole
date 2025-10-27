/**
 * MTGRules
 *
 * Magic: The Gathering specific authorization rules.
 */

import { AuthorizationRule } from "../types";

/**
 * Priority rule - players can only take actions when they have priority
 */
export const priorityRule: AuthorizationRule = {
  name: "mtg-priority-check",
  priority: 110,
  match: (action, context) => {
    return (
      action.startsWith("game.action.cast") ||
      action.startsWith("game.action.activate") ||
      action.startsWith("game.action.play")
    );
  },
  authorize: (action, context, state) => {
    // Check if player has priority
    const hasPriority = state?.priority?.currentPlayer === context.userId;

    if (!hasPriority) {
      return {
        authorized: false,
        reason: "You do not have priority",
      };
    }

    return { authorized: true };
  },
};

/**
 * Mana rule - players must have sufficient mana to cast spells
 */
export const manaRule: AuthorizationRule = {
  name: "mtg-mana-check",
  priority: 105,
  match: (action, context) => {
    return action === "game.action.cast.spell" && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Get player's mana pool
    const player = state?.players?.find((p: any) => p.id === context.userId);
    if (!player) {
      return {
        authorized: false,
        reason: "Player not found in game",
      };
    }

    // Get spell being cast
    const spell = state?.targetSpell || state?.selectedCard;
    if (!spell) {
      return { authorized: true }; // No spell selected yet
    }

    // Check mana cost
    const manaCost = spell.manaCost || {};
    const manaPool = player.manaPool || {};

    // Simple check - would be more complex in real implementation
    for (const [color, amount] of Object.entries(manaCost)) {
      if ((manaPool[color] || 0) < (amount as number)) {
        return {
          authorized: false,
          reason: `Insufficient ${color} mana`,
        };
      }
    }

    return { authorized: true };
  },
};

/**
 * Land limit rule - players can only play one land per turn
 */
export const landLimitRule: AuthorizationRule = {
  name: "mtg-land-limit",
  priority: 100,
  match: (action, context) => {
    return action === "game.action.play.land" && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Get player's land plays this turn
    const player = state?.players?.find((p: any) => p.id === context.userId);
    if (!player) {
      return {
        authorized: false,
        reason: "Player not found in game",
      };
    }

    const landsPlayedThisTurn = player.landsPlayedThisTurn || 0;
    const landLimit = player.landLimit || 1;

    if (landsPlayedThisTurn >= landLimit) {
      return {
        authorized: false,
        reason: "Already played maximum lands this turn",
      };
    }

    return { authorized: true };
  },
};

/**
 * Main phase rule - sorcery speed actions only in main phase
 */
export const mainPhaseRule: AuthorizationRule = {
  name: "mtg-main-phase-check",
  priority: 95,
  match: (action, context) => {
    return (
      (action === "game.action.cast.sorcery" ||
        action === "game.action.play.land") &&
      context.role === "player"
    );
  },
  authorize: (action, context, state) => {
    const currentPhase = state?.currentPhase?.name || state?.phase;

    // Must be in a main phase
    if (currentPhase !== "main1" && currentPhase !== "main2") {
      return {
        authorized: false,
        reason: "Sorcery-speed actions only allowed in main phase",
      };
    }

    // Stack must be empty for sorcery-speed actions
    if (state?.stack && state.stack.length > 0) {
      return {
        authorized: false,
        reason: "Cannot cast sorceries while stack is not empty",
      };
    }

    return { authorized: true };
  },
};

/**
 * Stack resolution rule - players can only respond when stack is active
 */
export const stackRule: AuthorizationRule = {
  name: "mtg-stack-response",
  priority: 90,
  match: (action, context) => {
    return action === "game.action.respond" && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Check if there's anything on the stack to respond to
    if (!state?.stack || state.stack.length === 0) {
      return {
        authorized: false,
        reason: "Nothing on the stack to respond to",
      };
    }

    return { authorized: true };
  },
};

/**
 * Commander rule - commander must be cast from command zone
 */
export const commanderRule: AuthorizationRule = {
  name: "mtg-commander-zone",
  priority: 85,
  match: (action, context) => {
    return action === "game.action.cast.commander" && context.role === "player";
  },
  authorize: (action, context, state) => {
    const commander = state?.targetCard || state?.selectedCard;

    if (!commander) {
      return {
        authorized: false,
        reason: "No commander selected",
      };
    }

    // Commander must be in command zone
    if (commander.zone !== "command") {
      return {
        authorized: false,
        reason: "Commander must be cast from command zone",
      };
    }

    // Check commander tax
    const player = state?.players?.find((p: any) => p.id === context.userId);
    const commanderCasts = player?.commanderCasts || 0;
    const additionalCost = commanderCasts * 2; // 2 generic mana per previous cast

    if (additionalCost > 0) {
      // Would need to check if player has enough for commander tax
      // Simplified for this example
    }

    return { authorized: true };
  },
};

/**
 * All MTG-specific rules
 */
export const mtgRules: AuthorizationRule[] = [
  priorityRule,
  manaRule,
  landLimitRule,
  mainPhaseRule,
  stackRule,
  commanderRule,
];
