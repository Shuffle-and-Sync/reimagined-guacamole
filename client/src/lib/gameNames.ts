// Mapping from community IDs to actual game names
export const GAME_NAMES: Record<string, string> = {
  'scry-gather': 'Magic: The Gathering',
  'pokestream-hub': 'Pokemon TCG',
  'decksong': 'Disney Lorcana',
  'duelcraft': 'Yu-Gi-Oh!',
  'bladeforge': 'Fantasy TCG',
  'deckmaster': 'Strategy TCG',
};

export function getGameName(communityId: string): string {
  return GAME_NAMES[communityId] || 'Unknown Game';
}