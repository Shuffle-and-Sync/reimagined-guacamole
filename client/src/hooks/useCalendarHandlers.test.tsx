import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Community } from "@shared/schema";
import { useCalendarHandlers } from "./useCalendarHandlers";

// Mock toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockCommunity: Community = {
  id: "test-community",
  name: "Test Community",
  displayName: "Test Community",
  description: "Test",
  themeColor: "#000",
  iconClass: "icon-test",
  createdAt: new Date(),
  isActive: true,
  settings: null,
};

const mockEvent = {
  id: "event-1",
  title: "Test Event",
  type: "tournament",
  date: "2024-12-31",
  time: "18:00",
  location: "Test Location",
  description: "Test Description",
  communityId: "test-community",
  creator: null,
  community: mockCommunity,
  attendeeCount: 5,
  mainPlayers: 8,
  alternates: 2,
};

describe("useCalendarHandlers", () => {
  let mockCreateMutation: any;
  let mockUpdateMutation: any;
  let mockDeleteMutation: any;
  let mockJoinMutation: any;

  beforeEach(() => {
    mockCreateMutation = {
      mutate: vi.fn(),
      isPending: false,
    };
    mockUpdateMutation = {
      mutate: vi.fn(),
      isPending: false,
    };
    mockDeleteMutation = {
      mutate: vi.fn(),
    };
    mockJoinMutation = {
      mutate: vi.fn(),
    };

    // Mock window.confirm
    global.confirm = vi.fn(() => true);
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    expect(result.current.isCreateDialogOpen).toBe(false);
    expect(result.current.isCSVUploadOpen).toBe(false);
    expect(result.current.isGraphicsOpen).toBe(false);
    expect(result.current.editingEventId).toBe(null);
    expect(result.current.editingEventData).toBe(undefined);
  });

  it("toggles create dialog state", () => {
    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    act(() => {
      result.current.setIsCreateDialogOpen(true);
    });

    expect(result.current.isCreateDialogOpen).toBe(true);
  });

  it("handles event editing", () => {
    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    act(() => {
      result.current.handleEditEventById("event-1");
    });

    expect(result.current.isCreateDialogOpen).toBe(true);
    expect(result.current.editingEventId).toBe("event-1");
    expect(result.current.editingEventData).toMatchObject({
      title: "Test Event",
      type: "tournament",
    });
  });

  it("handles event deletion with confirmation", () => {
    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    act(() => {
      result.current.handleDeleteEvent("event-1");
    });

    expect(global.confirm).toHaveBeenCalled();
    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(
      "event-1",
      expect.any(Object),
    );
  });

  it("does not delete event if confirmation is cancelled", () => {
    global.confirm = vi.fn(() => false);

    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    act(() => {
      result.current.handleDeleteEvent("event-1");
    });

    expect(global.confirm).toHaveBeenCalled();
    expect(mockDeleteMutation.mutate).not.toHaveBeenCalled();
  });

  it("handles join/leave event", () => {
    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    act(() => {
      result.current.handleAttendEvent("event-1", false);
    });

    expect(mockJoinMutation.mutate).toHaveBeenCalledWith(
      { eventId: "event-1", isCurrentlyAttending: false },
      expect.any(Object),
    );
  });

  it("handles graphics generation", () => {
    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    act(() => {
      result.current.handleGenerateGraphics("event-1", "Test Event");
    });

    expect(result.current.isGraphicsOpen).toBe(true);
    expect(result.current.selectedEventForGraphics).toEqual({
      id: "event-1",
      title: "Test Event",
    });
  });

  it("calculates isSubmitting correctly", () => {
    mockCreateMutation.isPending = true;

    const { result } = renderHook(() =>
      useCalendarHandlers({
        events: [mockEvent],
        selectedCommunity: mockCommunity,
        createEventMutation: mockCreateMutation,
        updateEventMutation: mockUpdateMutation,
        deleteEventMutation: mockDeleteMutation,
        joinEventMutation: mockJoinMutation,
      }),
    );

    expect(result.current.isSubmitting).toBe(true);
  });
});
