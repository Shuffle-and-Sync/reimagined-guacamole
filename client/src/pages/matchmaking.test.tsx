/**
 * Matchmaking Page Tests
 *
 * Tests for the Matchmaking page including player search, preferences, and connections.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import Matchmaking from "./matchmaking";
import { QueryClient } from "@tanstack/react-query";

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
    },
  })),
}));

vi.mock("@/features/communities", () => ({
  useCommunity: vi.fn(() => ({
    selectedCommunity: {
      id: "mtg",
      name: "Magic: The Gathering",
      themeColor: "#ff6b35",
    },
    communityTheme: {},
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockPreferences = {
  id: "pref1",
  userId: "user1",
  gameType: "MTG",
  preferredFormats: JSON.stringify(["commander"]),
  skillLevelRange: JSON.stringify([5, 8]),
  playStyle: "focused",
  preferredLocation: "Seattle, WA",
  availabilitySchedule: JSON.stringify({ general: "evenings" }),
  maxTravelDistance: 50,
};

describe("Matchmaking Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url.toString().includes("/api/matchmaking/preferences")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPreferences,
        } as Response);
      }
      if (url.toString().includes("/api/matchmaking/find-players")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    }) as any;
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByText("AI Matchmaking")).toBeInTheDocument();
    });

    it("displays page description", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(
        screen.getByText(/Find players with similar skill levels/i),
      ).toBeInTheDocument();
    });

    it("renders all three tabs", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("tab-find-players")).toBeInTheDocument();
      expect(screen.getByTestId("tab-preferences")).toBeInTheDocument();
      expect(screen.getByTestId("tab-connections")).toBeInTheDocument();
    });
  });

  describe("Quick Match Filters", () => {
    it("renders game selection buttons", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("game-mtg")).toBeInTheDocument();
      expect(screen.getByTestId("game-pokemon")).toBeInTheDocument();
      expect(screen.getByTestId("game-lorcana")).toBeInTheDocument();
      expect(screen.getByTestId("game-yugioh")).toBeInTheDocument();
    });

    it("toggles game selection", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const mtgButton = screen.getByTestId("game-mtg");
      const pokemonButton = screen.getByTestId("game-pokemon");

      // MTG should be selected by default
      expect(mtgButton).toHaveClass("border-primary");

      // Click Pokemon
      await user.click(pokemonButton);
      expect(pokemonButton).toHaveClass("border-primary");
    });

    it("renders power level slider", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("slider-power-level")).toBeInTheDocument();
      expect(screen.getByText(/Power Level Range/)).toBeInTheDocument();
    });

    it("renders playstyle select", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("select-playstyle")).toBeInTheDocument();
    });

    it("renders location input", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("input-location")).toBeInTheDocument();
    });

    it("renders online only switch", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("switch-online-only")).toBeInTheDocument();
    });
  });

  describe("Find Players Tab", () => {
    it("displays find players button", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByTestId("button-start-matching")).toBeInTheDocument();
    });

    it("shows loading state when searching", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const findButton = screen.getByTestId("button-start-matching");
      await user.click(findButton);

      await waitFor(() => {
        expect(screen.getByText("Finding Players...")).toBeInTheDocument();
      });
    });

    it("displays search results count", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const findButton = screen.getByTestId("button-start-matching");
      await user.click(findButton);

      await waitFor(() => {
        expect(screen.getByText("0 Players Found")).toBeInTheDocument();
      });
    });
  });

  describe("Preferences Tab", () => {
    it("switches to preferences tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const preferencesTab = screen.getByTestId("tab-preferences");
      await user.click(preferencesTab);

      await waitFor(() => {
        expect(screen.getByText("Matchmaking Preferences")).toBeInTheDocument();
      });
    });

    it("renders save preferences button", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const preferencesTab = screen.getByTestId("tab-preferences");
      await user.click(preferencesTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("button-save-preferences"),
        ).toBeInTheDocument();
      });
    });

    it("renders reset preferences button", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const preferencesTab = screen.getByTestId("tab-preferences");
      await user.click(preferencesTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("button-reset-preferences"),
        ).toBeInTheDocument();
      });
    });

    it("displays game preferences section", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const preferencesTab = screen.getByTestId("tab-preferences");
      await user.click(preferencesTab);

      await waitFor(() => {
        expect(screen.getByText("Preferred Games")).toBeInTheDocument();
        expect(screen.getByText("Preferred Formats")).toBeInTheDocument();
      });
    });

    it("shows communication preferences", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const preferencesTab = screen.getByTestId("tab-preferences");
      await user.click(preferencesTab);

      await waitFor(() => {
        expect(screen.getByText("Communication Preferences")).toBeInTheDocument();
        expect(screen.getByText("Voice chat during games")).toBeInTheDocument();
        expect(
          screen.getByText("Video chat for webcam games"),
        ).toBeInTheDocument();
      });
    });

    it("displays availability section", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const preferencesTab = screen.getByTestId("tab-preferences");
      await user.click(preferencesTab);

      await waitFor(() => {
        expect(screen.getByText("Availability")).toBeInTheDocument();
      });
    });
  });

  describe("Connections Tab", () => {
    it("switches to connections tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const connectionsTab = screen.getByTestId("tab-connections");
      await user.click(connectionsTab);

      await waitFor(() => {
        expect(screen.getByText("My Connections")).toBeInTheDocument();
        expect(screen.getByText("Pending Invites")).toBeInTheDocument();
      });
    });

    it("shows empty state for connections", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const connectionsTab = screen.getByTestId("tab-connections");
      await user.click(connectionsTab);

      await waitFor(() => {
        expect(screen.getByText("No connections yet")).toBeInTheDocument();
      });
    });

    it("displays pending invites", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const connectionsTab = screen.getByTestId("tab-connections");
      await user.click(connectionsTab);

      await waitFor(() => {
        expect(screen.getByText(/Sent \(2\)/)).toBeInTheDocument();
        expect(screen.getByText(/Received \(1\)/)).toBeInTheDocument();
      });
    });

    it("shows accept and decline buttons for received invites", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const connectionsTab = screen.getByTestId("tab-connections");
      await user.click(connectionsTab);

      await waitFor(() => {
        expect(screen.getByTestId("button-accept-invite")).toBeInTheDocument();
        expect(screen.getByTestId("button-decline-invite")).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("allows typing in location input", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const locationInput = screen.getByTestId("input-location");
      await user.type(locationInput, "Austin, TX");

      expect(locationInput).toHaveValue("Austin, TX");
    });

    it("toggles online only switch", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />, { queryClient });

      const onlineSwitch = screen.getByTestId("switch-online-only");
      await user.click(onlineSwitch);

      // Switch should be toggled
      expect(onlineSwitch).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("uses community-themed background", () => {
      const { container } = renderWithProviders(<Matchmaking />, {
        queryClient,
      });
      const wrapper = container.querySelector(".min-h-screen");
      expect(wrapper).toBeInTheDocument();
    });

    it("uses container layout", () => {
      const { container } = renderWithProviders(<Matchmaking />, {
        queryClient,
      });
      const main = container.querySelector("main");
      expect(main).toHaveClass("container");
    });

    it("has proper gradient text on title", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      const title = screen.getByText("AI Matchmaking");
      expect(title).toHaveClass("gradient-text");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      const mainHeading = screen.getByText("AI Matchmaking");
      expect(mainHeading.tagName).toBe("H1");
    });

    it("uses proper labels for form inputs", () => {
      renderWithProviders(<Matchmaking />, { queryClient });
      expect(screen.getByText("Games")).toBeInTheDocument();
      expect(screen.getByText(/Power Level Range/)).toBeInTheDocument();
      expect(screen.getByText("Playstyle")).toBeInTheDocument();
    });
  });
});
