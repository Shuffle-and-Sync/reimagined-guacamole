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
  "scry-gather": {
    id: "scry-gather",
    name: "scry-gather",
    displayName: "Scry & Gather",
    description:
      "Magic: The Gathering streaming coordination. Manage spell circles, strategic alliances, and create legendary MTG content.",
    colors: {
      primary: "hsl(0, 75%, 60%)",
      secondary: "hsl(0, 60%, 45%)",
      accent: "hsl(25, 80%, 65%)",
      background: "hsl(0, 15%, 8%)",
      surface: "hsl(0, 20%, 12%)",
      text: "hsl(0, 10%, 95%)",
      textSecondary: "hsl(0, 15%, 70%)",
    },
    fonts: {
      heading: '"Cinzel Decorative", "Cinzel", "Times New Roman", serif',
      body: '"Crimson Text", "Cormorant Garamond", "Georgia", serif',
      accent: '"UnifrakturMaguntia", "Uncial Antiqua", fantasy',
    },
    iconClass: "fas fa-magic",
    gradients: {
      primary:
        "linear-gradient(135deg, hsl(0, 75%, 60%) 0%, hsl(25, 80%, 65%) 100%)",
      hero: "linear-gradient(135deg, hsl(0, 15%, 8%) 0%, hsl(0, 25%, 15%) 50%, hsl(0, 15%, 8%) 100%)",
      card: "linear-gradient(145deg, hsl(0, 20%, 12%) 0%, hsl(0, 25%, 16%) 100%)",
    },
    terminology: {
      events: "Gatherings",
      quickMatch: "Spell Circle",
      tableSync: "TableSync",
      schedule: "Conjure Gathering",
      host: "Planeswalker",
      coHost: "Ally Mage",
      participants: "Spellcasters",
      community: "Multiverse",
      messages: "Spell Messages",
      notifications: "Planar Updates",
    },
  },
  // Add other community themes here...
};

export function getCommunityTheme(communityId?: string | null): CommunityTheme {
  if (!communityId) {
    return getDefaultTheme();
  }

  return communityThemes[communityId] || getDefaultTheme();
}

export function getDefaultTheme(): CommunityTheme {
  return {
    id: "default",
    name: "default",
    displayName: "All Realms",
    description: "Default theme for all communities",
    colors: {
      primary: "hsl(262, 75%, 60%)",
      secondary: "hsl(262, 60%, 45%)",
      accent: "hsl(25, 80%, 65%)",
      background: "hsl(224, 15%, 8%)",
      surface: "hsl(224, 20%, 12%)",
      text: "hsl(210, 10%, 95%)",
      textSecondary: "hsl(210, 15%, 70%)",
    },
    fonts: {
      heading: '"Inter", "Helvetica Neue", "Arial", sans-serif',
      body: '"Inter", "Helvetica Neue", "Arial", sans-serif',
      accent: '"DM Sans", "Inter", sans-serif',
    },
    iconClass: "fas fa-globe",
    gradients: {
      primary:
        "linear-gradient(135deg, hsl(262, 75%, 60%) 0%, hsl(25, 80%, 65%) 100%)",
      hero: "linear-gradient(135deg, hsl(224, 15%, 8%) 0%, hsl(224, 25%, 15%) 50%, hsl(224, 15%, 8%) 100%)",
      card: "linear-gradient(145deg, hsl(224, 20%, 12%) 0%, hsl(224, 25%, 16%) 100%)",
    },
    terminology: {
      events: "Events",
      quickMatch: "Quick Match",
      tableSync: "TableSync",
      schedule: "Schedule Event",
      host: "Host",
      coHost: "Co-Host",
      participants: "Participants",
      community: "Community",
      messages: "Messages",
      notifications: "Notifications",
    },
  };
}

export function applyCommunityTheme(theme: CommunityTheme): void {
  const root = document.documentElement;

  // Apply CSS custom properties
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--color-accent", theme.colors.accent);
  root.style.setProperty("--color-background", theme.colors.background);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-text", theme.colors.text);
  root.style.setProperty("--color-text-secondary", theme.colors.textSecondary);

  root.style.setProperty("--font-heading", theme.fonts.heading);
  root.style.setProperty("--font-body", theme.fonts.body);
  root.style.setProperty("--font-accent", theme.fonts.accent);

  root.style.setProperty("--gradient-primary", theme.gradients.primary);
  root.style.setProperty("--gradient-hero", theme.gradients.hero);
  root.style.setProperty("--gradient-card", theme.gradients.card);
}
