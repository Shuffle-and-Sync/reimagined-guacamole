// Community-specific theming system
export interface CommunityTheme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  iconClass: string;
  gradients: {
    primary: string;
    hero: string;
    card: string;
  };
  terminology: {
    events: string;
    quickMatch: string;
    tableSync: string;
    schedule: string;
    host: string;
    coHost: string;
    participants: string;
    community: string;
    messages: string;
    notifications: string;
  };
}

export const communityThemes: Record<string, CommunityTheme> = {
  'scry-gather': {
    id: 'scry-gather',
    name: 'scry-gather',
    displayName: 'Scry & Gather',
    description: 'Magic: The Gathering streaming coordination. Manage spell circles, strategic alliances, and create legendary MTG content.',
    colors: {
      primary: 'hsl(0, 75%, 60%)',
      secondary: 'hsl(0, 60%, 45%)',
      accent: 'hsl(25, 80%, 65%)',
      background: 'hsl(0, 15%, 8%)',
      surface: 'hsl(0, 20%, 12%)',
      text: 'hsl(0, 10%, 95%)',
      textSecondary: 'hsl(0, 15%, 70%)',
    },
    fonts: {
      heading: '"Cinzel Decorative", "Cinzel", "Times New Roman", serif',
      body: '"Crimson Text", "Cormorant Garamond", "Georgia", serif',
      accent: '"UnifrakturMaguntia", "Uncial Antiqua", fantasy',
    },
    iconClass: 'fas fa-magic',
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0, 75%, 60%) 0%, hsl(25, 80%, 65%) 100%)',
      hero: 'linear-gradient(135deg, hsl(0, 15%, 8%) 0%, hsl(0, 25%, 15%) 50%, hsl(0, 15%, 8%) 100%)',
      card: 'linear-gradient(145deg, hsl(0, 20%, 12%) 0%, hsl(0, 25%, 16%) 100%)',
    },
    terminology: {
      events: 'Gatherings',
      quickMatch: 'Spell Circle',
      tableSync: 'TableSync',
      schedule: 'Conjure Gathering',
      host: 'Planeswalker',
      coHost: 'Ally Mage',
      participants: 'Spellcasters',
      community: 'Multiverse',
      messages: 'Mystic Whispers',
      notifications: 'Scrying Visions',
    },
  },
  'pokestream-hub': {
    id: 'pokestream-hub',
    name: 'pokestream-hub',
    displayName: 'PokeStream Hub',
    description: 'Unite Pokemon trainers worldwide. Coordinate teams, host battle arenas, and create legendary content together.',
    colors: {
      primary: 'hsl(45, 100%, 50%)',
      secondary: 'hsl(45, 90%, 35%)',
      accent: 'hsl(220, 80%, 65%)',
      background: 'hsl(45, 20%, 8%)',
      surface: 'hsl(45, 25%, 12%)',
      text: 'hsl(45, 15%, 95%)',
      textSecondary: 'hsl(45, 20%, 70%)',
    },
    fonts: {
      heading: '"Orbitron", "Exo 2", "Arial Black", sans-serif',
      body: '"Nunito", "Roboto", "Helvetica", sans-serif',
      accent: '"Fredoka One", "Righteous", cursive',
    },
    iconClass: 'fas fa-bolt',
    gradients: {
      primary: 'linear-gradient(135deg, hsl(45, 100%, 50%) 0%, hsl(220, 80%, 65%) 100%)',
      hero: 'linear-gradient(135deg, hsl(45, 20%, 8%) 0%, hsl(45, 30%, 15%) 50%, hsl(45, 20%, 8%) 100%)',
      card: 'linear-gradient(145deg, hsl(45, 25%, 12%) 0%, hsl(45, 30%, 16%) 100%)',
    },
    terminology: {
      events: 'Adventures',
      quickMatch: 'Wild Encounter',
      tableSync: 'TableSync',
      schedule: 'Plan Adventure',
      host: 'Gym Leader',
      coHost: 'Elite Trainer',
      participants: 'Trainers',
      community: 'Pokemon World',
      messages: 'PokeChat',
      notifications: 'PokeAlerts',
    },
  },
  'decksong': {
    id: 'decksong',
    name: 'decksong',
    displayName: 'Decksong',
    description: 'Disney Lorcana creators unite in harmony. Orchestrate collaborative streams and build magical kingdoms together.',
    colors: {
      primary: 'hsl(300, 70%, 65%)',
      secondary: 'hsl(300, 60%, 45%)',
      accent: 'hsl(200, 80%, 70%)',
      background: 'hsl(300, 15%, 8%)',
      surface: 'hsl(300, 20%, 12%)',
      text: 'hsl(300, 10%, 95%)',
      textSecondary: 'hsl(300, 15%, 70%)',
    },
    fonts: {
      heading: '"Cinzel", "Libre Baskerville", "Times New Roman", serif',
      body: '"Crimson Text", "Libre Baskerville", "Georgia", serif',
      accent: '"Dancing Script", "Pacifico", cursive',
    },
    iconClass: 'fas fa-crown',
    gradients: {
      primary: 'linear-gradient(135deg, hsl(300, 70%, 65%) 0%, hsl(200, 80%, 70%) 100%)',
      hero: 'linear-gradient(135deg, hsl(300, 15%, 8%) 0%, hsl(300, 25%, 15%) 50%, hsl(300, 15%, 8%) 100%)',
      card: 'linear-gradient(145deg, hsl(300, 20%, 12%) 0%, hsl(300, 25%, 16%) 100%)',
    },
    terminology: {
      events: 'Royal Gatherings',
      quickMatch: 'Enchanted Duel',
      tableSync: 'TableSync',
      schedule: 'Weave Tale',
      host: 'Storyteller',
      coHost: 'Narrator',
      participants: 'Dreamers',
      community: 'Great Illuminary',
      messages: 'Fairy Letters',
      notifications: 'Magic Mirrors',
    },
  },
  'duelcraft': {
    id: 'duelcraft',
    name: 'duelcraft',
    displayName: 'Duelcraft',
    description: 'Yu-Gi-Oh duelists assemble! Master the shadow realm of collaborative content and strategic partnerships.',
    colors: {
      primary: 'hsl(240, 70%, 65%)',
      secondary: 'hsl(240, 60%, 45%)',
      accent: 'hsl(270, 80%, 70%)',
      background: 'hsl(240, 15%, 8%)',
      surface: 'hsl(240, 20%, 12%)',
      text: 'hsl(240, 10%, 95%)',
      textSecondary: 'hsl(240, 15%, 70%)',
    },
    fonts: {
      heading: '"Teko", "Saira Condensed", "Impact", sans-serif',
      body: '"Exo 2", "Roboto Condensed", sans-serif',
      accent: '"Creepster", "Nosifer", cursive',
    },
    iconClass: 'fas fa-eye',
    gradients: {
      primary: 'linear-gradient(135deg, hsl(240, 70%, 65%) 0%, hsl(270, 80%, 70%) 100%)',
      hero: 'linear-gradient(135deg, hsl(240, 15%, 8%) 0%, hsl(240, 25%, 15%) 50%, hsl(240, 15%, 8%) 100%)',
      card: 'linear-gradient(145deg, hsl(240, 20%, 12%) 0%, hsl(240, 25%, 16%) 100%)',
    },
    terminology: {
      events: 'Shadow Duels',
      quickMatch: 'Heart of Cards',
      tableSync: 'TableSync',
      schedule: 'Summon Duel',
      host: 'Duel Master',
      coHost: 'Shadow Duelist',
      participants: 'Duelists',
      community: 'Duel Monsters',
      messages: 'Shadow Whispers',
      notifications: 'Millennium Alerts',
    },
  },
  'bladeforge': {
    id: 'bladeforge',
    name: 'bladeforge',
    displayName: 'Bladeforge',
    description: 'Forge alliances in strategic card combat. Unite tactical minds and coordinate precision strikes in competitive gaming.',
    colors: {
      primary: 'hsl(160, 70%, 50%)',
      secondary: 'hsl(160, 60%, 35%)',
      accent: 'hsl(190, 80%, 60%)',
      background: 'hsl(160, 15%, 8%)',
      surface: 'hsl(160, 20%, 12%)',
      text: 'hsl(160, 10%, 95%)',
      textSecondary: 'hsl(160, 15%, 70%)',
    },
    fonts: {
      heading: '"Rajdhani", "Orbitron", "Impact", sans-serif',
      body: '"Exo 2", "Open Sans", sans-serif',
      accent: '"Saira Condensed", "Oswald", sans-serif',
    },
    iconClass: 'fas fa-sword',
    gradients: {
      primary: 'linear-gradient(135deg, hsl(160, 70%, 50%) 0%, hsl(190, 80%, 60%) 100%)',
      hero: 'linear-gradient(135deg, hsl(160, 15%, 8%) 0%, hsl(160, 25%, 15%) 50%, hsl(160, 15%, 8%) 100%)',
      card: 'linear-gradient(145deg, hsl(160, 20%, 12%) 0%, hsl(160, 25%, 16%) 100%)',
    },
    terminology: {
      events: 'Operations',
      quickMatch: 'Strike Mission',
      tableSync: 'TableSync',
      schedule: 'Deploy Operation',
      host: 'Commander',
      coHost: 'Lieutenant',
      participants: 'Operatives',
      community: 'Alliance',
      messages: 'Tactical Comms',
      notifications: 'Intel Updates',
    },
  },
  'deckmaster': {
    id: 'deckmaster',
    name: 'deckmaster',
    displayName: 'Deckmaster',
    description: 'Master the art of strategic deck building across all trading card games with sophisticated analysis and collaboration.',
    colors: {
      primary: 'hsl(260, 70%, 65%)',
      secondary: 'hsl(260, 60%, 45%)',
      accent: 'hsl(280, 80%, 70%)',
      background: 'hsl(260, 15%, 8%)',
      surface: 'hsl(260, 20%, 12%)',
      text: 'hsl(260, 10%, 95%)',
      textSecondary: 'hsl(260, 15%, 70%)',
    },
    fonts: {
      heading: '"Playfair Display", "Crimson Text", serif',
      body: '"Source Sans Pro", "Inter", sans-serif',
      accent: '"Philosopher", "DM Sans", sans-serif',
    },
    iconClass: 'fas fa-chess',
    gradients: {
      primary: 'linear-gradient(135deg, hsl(260, 70%, 65%) 0%, hsl(280, 80%, 70%) 100%)',
      hero: 'linear-gradient(135deg, hsl(260, 15%, 8%) 0%, hsl(260, 25%, 15%) 50%, hsl(260, 15%, 8%) 100%)',
      card: 'linear-gradient(145deg, hsl(260, 20%, 12%) 0%, hsl(260, 25%, 16%) 100%)',
    },
    terminology: {
      events: 'Symposiums',
      quickMatch: 'Strategy Session',
      tableSync: 'TableSync',
      schedule: 'Arrange Session',
      host: 'Strategist',
      coHost: 'Analyst',
      participants: 'Masters',
      community: 'Academy',
      messages: 'Strategic Notes',
      notifications: 'Meta Reports',
    },
  },
};

export const defaultTheme: CommunityTheme = {
  id: 'default',
  name: 'default',
  displayName: 'Shuffle & Sync',
  description: 'Universal TCG streaming platform',
  colors: {
    primary: 'hsl(222, 84%, 65%)',
    secondary: 'hsl(222, 70%, 45%)',
    accent: 'hsl(280, 80%, 70%)',
    background: 'hsl(222, 15%, 8%)',
    surface: 'hsl(222, 20%, 12%)',
    text: 'hsl(222, 10%, 95%)',
    textSecondary: 'hsl(222, 15%, 70%)',
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
    accent: '"DM Sans", sans-serif',
  },
  iconClass: 'fas fa-cards',
  gradients: {
    primary: 'linear-gradient(135deg, hsl(222, 84%, 65%) 0%, hsl(280, 80%, 70%) 100%)',
    hero: 'linear-gradient(135deg, hsl(222, 15%, 8%) 0%, hsl(222, 25%, 15%) 50%, hsl(222, 15%, 8%) 100%)',
    card: 'linear-gradient(145deg, hsl(222, 20%, 12%) 0%, hsl(222, 25%, 16%) 100%)',
  },
  terminology: {
    events: 'Events',
    quickMatch: 'Quick Match',
    tableSync: 'TableSync',
    schedule: 'Schedule Event',
    host: 'Host',
    coHost: 'Co-Host',
    participants: 'Participants',
    community: 'Community',
    messages: 'Messages',
    notifications: 'Notifications',
  },
};

// Helper functions
export function getCommunityTheme(communityId?: string | null): CommunityTheme {
  if (!communityId) return defaultTheme;
  return communityThemes[communityId] || defaultTheme;
}

export function applyCommunityTheme(theme: CommunityTheme) {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--community-primary', theme.colors.primary);
  root.style.setProperty('--community-secondary', theme.colors.secondary);
  root.style.setProperty('--community-accent', theme.colors.accent);
  root.style.setProperty('--community-background', theme.colors.background);
  root.style.setProperty('--community-surface', theme.colors.surface);
  root.style.setProperty('--community-text', theme.colors.text);
  root.style.setProperty('--community-text-secondary', theme.colors.textSecondary);
  
  // Apply gradients
  root.style.setProperty('--community-gradient-primary', theme.gradients.primary);
  root.style.setProperty('--community-gradient-hero', theme.gradients.hero);
  root.style.setProperty('--community-gradient-card', theme.gradients.card);
  
  // Apply fonts
  root.style.setProperty('--community-font-heading', theme.fonts.heading);
  root.style.setProperty('--community-font-body', theme.fonts.body);
  root.style.setProperty('--community-font-accent', theme.fonts.accent);
}