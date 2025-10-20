/**
 * JoinEventButton Component Tests
 *
 * Tests for the JoinEventButton component with complex conditional logic
 * for joining/leaving events and player type selection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils";
import { QueryClient } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { JoinEventButton } from "./JoinEventButton";
import type { CalendarEvent, Attendee } from "../types";

// Mock useAuth hook
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    },
  })),
}));

// Mock useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("JoinEventButton Component", () => {
  let queryClient: QueryClient;
  const mockOnSuccess = vi.fn();

  const mockEvent: CalendarEvent = {
    id: "event-123",
    title: "Commander Night",
    description: "Casual EDH games",
    type: "game_pod",
    date: "2024-12-01",
    time: "18:00",
    location: "Local Game Store",
    playerSlots: 4,
    alternateSlots: 2,
    gameFormat: "commander",
    powerLevel: 5,
    creator: { id: "creator-1", name: "Event Creator" },
    creatorId: "creator-1",
    attendeeCount: 2,
    mainPlayers: 2,
    alternates: 0,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockOnSuccess.mockClear();
    mockFetch.mockClear();

    // Default: set empty attendees in query cache
    queryClient.setQueryData(["/api/events", mockEvent.id, "attendees"], []);

    // Default fetch mock for mutations
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe("Rendering - User Not Attending", () => {
    it("renders Join Pod button when user is not attending and slots available", async () => {
      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByTestId("button-join-event-123")).toBeInTheDocument();
      });

      expect(screen.getByText("Join Pod")).toBeInTheDocument();
    });

    it("renders Pod Full button when all slots are taken", async () => {
      const fullEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 4,
        alternates: 2,
      };

      renderWithProviders(
        <JoinEventButton
          event={fullEvent}
          isFull={true}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByTestId("button-full-event-123")).toBeInTheDocument();
      });

      expect(screen.getByText("Pod Full")).toBeInTheDocument();
    });

    it("renders Join as Alternate button when only alternate slots available", async () => {
      const onlyAlternateEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 4, // All main slots filled
        alternates: 0, // Alternate slots available
      };

      renderWithProviders(
        <JoinEventButton
          event={onlyAlternateEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-join-alternate-event-123"),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Join as Alternate")).toBeInTheDocument();
    });
  });

  describe("Rendering - User Already Attending", () => {
    it("renders Leave Pod button when user is attending", async () => {
      const attendees: Attendee[] = [
        {
          userId: "user-123",
          eventId: "event-123",
          status: "attending",
          role: "participant",
          playerType: "main",
          user: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          },
        },
      ];

      // Set the attendees data in query client
      queryClient.setQueryData(
        ["/api/events", "event-123", "attendees"],
        attendees,
      );

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-leave-event-123"),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Leave Pod")).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("handles different event IDs", async () => {
      const customEvent = { ...mockEvent, id: "custom-event-456" };

      renderWithProviders(
        <JoinEventButton
          event={customEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-join-custom-event-456"),
        ).toBeInTheDocument();
      });
    });

    it("handles events with different player slot configurations", async () => {
      const largeEvent: CalendarEvent = {
        ...mockEvent,
        playerSlots: 8,
        alternateSlots: 4,
        mainPlayers: 3,
        alternates: 1,
      };

      renderWithProviders(
        <JoinEventButton
          event={largeEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByText("Join Pod")).toBeInTheDocument();
      });
    });

    it("handles events with no alternate slots", async () => {
      const noAlternatesEvent: CalendarEvent = {
        ...mockEvent,
        alternateSlots: 0,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={noAlternatesEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByText("Join Pod")).toBeInTheDocument();
      });
    });
  });

  describe("Conditional Logic - Join Button Display", () => {
    it("shows Pod Full when main and alternate slots are full", async () => {
      const fullEvent: CalendarEvent = {
        ...mockEvent,
        playerSlots: 4,
        alternateSlots: 2,
        mainPlayers: 4,
        alternates: 2,
      };

      renderWithProviders(
        <JoinEventButton
          event={fullEvent}
          isFull={true}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByText("Pod Full")).toBeInTheDocument();
      });

      const button = screen.getByTestId("button-full-event-123");
      expect(button).toBeDisabled();
    });

    it("shows Join as Alternate when only alternate slots remain", async () => {
      const onlyAlternatesEvent: CalendarEvent = {
        ...mockEvent,
        playerSlots: 4,
        alternateSlots: 2,
        mainPlayers: 4,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={onlyAlternatesEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByText("Join as Alternate")).toBeInTheDocument();
      });
    });

    it("shows Join Pod dialog when main slots are available", async () => {
      const availableEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 2,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={availableEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByText("Join Pod")).toBeInTheDocument();
      });
    });
  });

  describe("Event Emission - Join Dialog", () => {
    it("opens dialog when Join Pod button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByTestId("button-join-event-123")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-event-123"));

      await waitFor(() => {
        expect(screen.getByText("Join Game Pod")).toBeInTheDocument();
        expect(
          screen.getByText(/Choose your player type for Commander Night/),
        ).toBeInTheDocument();
      });
    });

    it("closes dialog when Cancel button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByTestId("button-join-event-123")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-event-123"));

      await waitFor(() => {
        expect(screen.getByTestId("button-cancel-join")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-cancel-join"));

      await waitFor(() => {
        expect(screen.queryByText("Join Game Pod")).not.toBeInTheDocument();
      });
    });
  });

  describe("Event Emission - Join as Main", () => {
    it("calls onSuccess when join is successful", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByTestId("button-join-event-123")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-event-123"));

      await waitFor(() => {
        expect(screen.getByTestId("button-confirm-join")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-confirm-join"));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("sends correct data when joining as main player", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByTestId("button-join-event-123")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-event-123"));

      await waitFor(() => {
        expect(screen.getByTestId("button-confirm-join")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-confirm-join"));

      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        const joinCall = calls.find((call: any) => call[0].includes("/join"));
        expect(joinCall).toBeDefined();
        const body = JSON.parse(joinCall[1].body);
        expect(body.playerType).toBe("main");
      });
    });
  });

  describe("Event Emission - Join as Alternate", () => {
    it("joins directly as alternate when only alternate slots available", async () => {
      const user = userEvent.setup();

      const onlyAlternatesEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 4,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={onlyAlternatesEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-join-alternate-event-123"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-alternate-event-123"));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("sends correct data when joining as alternate", async () => {
      const user = userEvent.setup();

      const onlyAlternatesEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 4,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={onlyAlternatesEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-join-alternate-event-123"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-alternate-event-123"));

      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        const joinCall = calls.find((call: any) => call[0].includes("/join"));
        expect(joinCall).toBeDefined();
        const body = JSON.parse(joinCall[1].body);
        expect(body.playerType).toBe("alternate");
      });
    });
  });

  describe("Event Emission - Leave Event", () => {
    it("calls onSuccess when leave is successful", async () => {
      const user = userEvent.setup();

      const attendees: Attendee[] = [
        {
          userId: "user-123",
          eventId: "event-123",
          status: "attending",
          role: "participant",
          playerType: "main",
          user: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          },
        },
      ];

      // Set the attendees data in query cache
      queryClient.setQueryData(
        ["/api/events", mockEvent.id, "attendees"],
        attendees,
      );

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-leave-event-123"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-leave-event-123"));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("sends DELETE request when leaving", async () => {
      const user = userEvent.setup();

      const attendees: Attendee[] = [
        {
          userId: "user-123",
          eventId: "event-123",
          status: "attending",
          role: "participant",
          playerType: "main",
          user: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          },
        },
      ];

      // Set the attendees data in query cache
      queryClient.setQueryData(
        ["/api/events", mockEvent.id, "attendees"],
        attendees,
      );

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-leave-event-123"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-leave-event-123"));

      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        const leaveCall = calls.find((call: any) => call[0].includes("/leave"));
        expect(leaveCall).toBeDefined();
        expect(leaveCall[1].method).toBe("DELETE");
      });
    });
  });

  describe("Button States", () => {
    it("disables button while joining", async () => {
      const user = userEvent.setup();

      let resolveJoin: any;
      const joinPromise = new Promise((resolve) => {
        resolveJoin = resolve;
      });

      mockFetch.mockImplementationOnce(() => joinPromise);

      const onlyAlternatesEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 4,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={onlyAlternatesEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-join-alternate-event-123"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-join-alternate-event-123"));

      await waitFor(() => {
        expect(screen.getByText("Joining...")).toBeInTheDocument();
      });

      // Resolve the promise
      resolveJoin({ ok: true, json: async () => ({ success: true }) });
    });

    it("disables button while leaving", async () => {
      const user = userEvent.setup();

      const attendees: Attendee[] = [
        {
          userId: "user-123",
          eventId: "event-123",
          status: "attending",
          role: "participant",
          playerType: "main",
          user: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          },
        },
      ];

      // Set the attendees data in query cache
      queryClient.setQueryData(
        ["/api/events", mockEvent.id, "attendees"],
        attendees,
      );

      let resolveLeave: any;
      const leavePromise = new Promise((resolve) => {
        resolveLeave = resolve;
      });

      mockFetch.mockImplementationOnce(() => leavePromise);

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("button-leave-event-123"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("button-leave-event-123"));

      await waitFor(() => {
        expect(screen.getByText("Leaving...")).toBeInTheDocument();
      });

      // Resolve the promise
      resolveLeave({ ok: true, json: async () => ({ success: true }) });
    });

    it("disables Pod Full button permanently", async () => {
      const fullEvent: CalendarEvent = {
        ...mockEvent,
        mainPlayers: 4,
        alternates: 2,
      };

      renderWithProviders(
        <JoinEventButton
          event={fullEvent}
          isFull={true}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        const button = screen.getByTestId("button-full-event-123");
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles fetch errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      renderWithProviders(
        <JoinEventButton
          event={mockEvent}
          isFull={false}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      // Should still render despite fetch error
      await waitFor(() => {
        expect(screen.getByText("Join Pod")).toBeInTheDocument();
      });
    });

    it("handles events with zero slots gracefully", async () => {
      const noSlotsEvent: CalendarEvent = {
        ...mockEvent,
        playerSlots: 0,
        alternateSlots: 0,
        mainPlayers: 0,
        alternates: 0,
      };

      renderWithProviders(
        <JoinEventButton
          event={noSlotsEvent}
          isFull={true}
          onSuccess={mockOnSuccess}
        />,
        { queryClient },
      );

      await waitFor(() => {
        expect(screen.getByText("Pod Full")).toBeInTheDocument();
      });
    });
  });
});
