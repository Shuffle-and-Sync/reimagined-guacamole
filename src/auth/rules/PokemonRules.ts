/**
 * PokemonRules
 *
 * Pokemon Trading Card Game specific authorization rules.
 */

import { AuthorizationRule } from "../types";

/**
 * Active Pokemon rule - must have an active Pokemon to attack
 */
export const activePokemonRule: AuthorizationRule = {
  name: "pokemon-active-check",
  priority: 110,
  match: (action, context) => {
    return action === "game.action.attack" && context.role === "player";
  },
  authorize: (action, context, state) => {
    const player = state?.players?.find((p: any) => p.id === context.userId);

    if (!player) {
      return {
        authorized: false,
        reason: "Player not found in game",
      };
    }

    if (!player.activePokemon) {
      return {
        authorized: false,
        reason: "No active Pokemon",
      };
    }

    return { authorized: true };
  },
};

/**
 * Energy attachment rule - can only attach one energy per turn
 */
export const energyAttachmentRule: AuthorizationRule = {
  name: "pokemon-energy-attachment",
  priority: 105,
  match: (action, context) => {
    return action === "game.action.attach.energy" && context.role === "player";
  },
  authorize: (action, context, state) => {
    const player = state?.players?.find((p: any) => p.id === context.userId);

    if (!player) {
      return {
        authorized: false,
        reason: "Player not found in game",
      };
    }

    const energiesAttachedThisTurn = player.energiesAttachedThisTurn || 0;

    if (energiesAttachedThisTurn >= 1) {
      return {
        authorized: false,
        reason: "Already attached energy this turn",
      };
    }

    return { authorized: true };
  },
};

/**
 * Attack energy requirement rule - Pokemon must have sufficient energy to attack
 */
export const attackEnergyRule: AuthorizationRule = {
  name: "pokemon-attack-energy",
  priority: 100,
  match: (action, context) => {
    return action === "game.action.attack" && context.role === "player";
  },
  authorize: (action, context, state) => {
    const player = state?.players?.find((p: any) => p.id === context.userId);

    if (!player?.activePokemon) {
      return {
        authorized: false,
        reason: "No active Pokemon",
      };
    }

    const activePokemon = player.activePokemon;
    const selectedAttack = state?.selectedAttack;

    if (!selectedAttack) {
      return { authorized: true }; // No attack selected yet
    }

    // Check energy requirements
    const attachedEnergy = activePokemon.attachedEnergy || [];
    const requiredEnergy = selectedAttack.energyCost || [];

    // Count energy by type
    const energyCounts: Record<string, number> = {};
    attachedEnergy.forEach((energy: any) => {
      const type = energy.type || "colorless";
      energyCounts[type] = (energyCounts[type] || 0) + 1;
    });

    // Check if requirements are met
    for (const requirement of requiredEnergy) {
      const type = requirement.type || "colorless";
      const amount = requirement.amount || 1;

      if ((energyCounts[type] || 0) < amount) {
        return {
          authorized: false,
          reason: `Insufficient ${type} energy for attack`,
        };
      }
    }

    return { authorized: true };
  },
};

/**
 * Evolution rule - can only evolve during main phase
 */
export const evolutionRule: AuthorizationRule = {
  name: "pokemon-evolution",
  priority: 95,
  match: (action, context) => {
    return action === "game.action.evolve" && context.role === "player";
  },
  authorize: (action, context, state) => {
    const currentPhase = state?.currentPhase?.name || state?.phase;

    // Must be in main phase
    if (currentPhase !== "main") {
      return {
        authorized: false,
        reason: "Can only evolve during main phase",
      };
    }

    const player = state?.players?.find((p: any) => p.id === context.userId);
    const targetPokemon = state?.targetPokemon;

    if (!targetPokemon) {
      return {
        authorized: false,
        reason: "No Pokemon selected for evolution",
      };
    }

    // Cannot evolve on the turn it was played
    if (targetPokemon.turnPlayed === state?.currentTurn) {
      return {
        authorized: false,
        reason: "Cannot evolve on the turn Pokemon was played",
      };
    }

    return { authorized: true };
  },
};

/**
 * Retreat rule - player must pay retreat cost
 */
export const retreatRule: AuthorizationRule = {
  name: "pokemon-retreat",
  priority: 90,
  match: (action, context) => {
    return action === "game.action.retreat" && context.role === "player";
  },
  authorize: (action, context, state) => {
    const player = state?.players?.find((p: any) => p.id === context.userId);

    if (!player?.activePokemon) {
      return {
        authorized: false,
        reason: "No active Pokemon to retreat",
      };
    }

    // Check if player has benched Pokemon to switch to
    if (!player.bench || player.bench.length === 0) {
      return {
        authorized: false,
        reason: "No benched Pokemon to retreat to",
      };
    }

    const activePokemon = player.activePokemon;
    const retreatCost = activePokemon.retreatCost || 0;
    const attachedEnergy = activePokemon.attachedEnergy?.length || 0;

    if (attachedEnergy < retreatCost) {
      return {
        authorized: false,
        reason: `Need ${retreatCost} energy to retreat (have ${attachedEnergy})`,
      };
    }

    return { authorized: true };
  },
};

/**
 * Prize card rule - can only take prize cards when knocking out opponent's Pokemon
 */
export const prizeCardRule: AuthorizationRule = {
  name: "pokemon-prize-cards",
  priority: 85,
  match: (action, context) => {
    return action === "game.action.take.prize" && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Check if a Pokemon was just knocked out
    if (!state?.lastKnockedOut) {
      return {
        authorized: false,
        reason: "Can only take prize cards after knocking out a Pokemon",
      };
    }

    // Check if the knock out was by this player
    if (state.lastKnockedOut.by !== context.userId) {
      return {
        authorized: false,
        reason: "Can only take prize cards for your own knock outs",
      };
    }

    return { authorized: true };
  },
};

/**
 * All Pokemon-specific rules
 */
export const pokemonRules: AuthorizationRule[] = [
  activePokemonRule,
  energyAttachmentRule,
  attackEnergyRule,
  evolutionRule,
  retreatRule,
  prizeCardRule,
];
