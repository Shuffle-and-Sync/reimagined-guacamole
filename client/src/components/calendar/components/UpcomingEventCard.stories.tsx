import { fn } from "@storybook/test";
import { UpcomingEventCard } from "./UpcomingEventCard";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * UpcomingEventCard displays a detailed event card with action buttons.
 *
 * Features:
 * - Event type icon and color coding
 * - Date and time display
 * - Community badge and pod status
 * - Attendee count
 * - Action buttons (Join/Leave, Edit, Delete, Generate Graphics)
 * - Creator-only actions
 * - Memoized to prevent unnecessary re-renders
 *
 * @example
 * ```tsx
 * <UpcomingEventCard
 *   event={{...}}
 *   user={currentUser}
 *   onEdit={(id) => console.log('Edit', id)}
 *   onDelete={(id) => console.log('Delete', id)}
 *   onJoinLeave={(id, attending) => console.log('Toggle', id, attending)}
 *   onGenerateGraphics={(id, title) => console.log('Generate', id)}
 *   onLoginRequired={() => console.log('Login required')}
 * />
 * ```
 */
const meta = {
  title: "Calendar/UpcomingEventCard",
  component: UpcomingEventCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UpcomingEventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser = {
  id: "user-1",
  email: "player@example.com",
  name: "Test Player",
  emailVerified: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: "user" as const,
};

/**
 * Standard tournament event as event creator
 */
export const AsEventCreator: Story = {
  args: {
    event: {
      id: "1",
      title: "Friday Night Magic",
      description: "Weekly Standard tournament with great prizes!",
      location: "Game Store",
      date: "2024-12-20",
      time: "7:00 PM",
      community: { name: "FNM Players", id: "fnm-1" } as any,
      attendeeCount: 16,
      isUserAttending: false,
      mainPlayers: 14,
      alternates: 2,
      creator: { id: "user-1" },
      creatorId: "user-1",
      hostId: "user-1",
      communityId: "fnm-1",
      startDate: new Date("2024-12-20T19:00:00"),
      endDate: new Date("2024-12-20T23:00:00"),
      type: "tournament",
      timezone: "America/New_York",
      maxAttendees: 32,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "tournament",
      name: "Tournament",
      icon: "fas fa-trophy",
      color: "bg-yellow-500",
    },
    user: mockUser,
    onEdit: fn(),
    onDelete: fn(),
    onJoinLeave: fn(),
    onGenerateGraphics: fn(),
    onLoginRequired: fn(),
  },
};

/**
 * Event where user is already attending
 */
export const UserAttending: Story = {
  args: {
    event: {
      id: "2",
      title: "Commander Night",
      description: "Bring your favorite Commander decks!",
      location: "Community Center",
      date: "2024-12-21",
      time: "6:00 PM",
      community: { name: "Commander League", id: "commander-1" } as any,
      attendeeCount: 12,
      isUserAttending: true,
      mainPlayers: 12,
      alternates: 0,
      creator: { id: "user-2" },
      creatorId: "user-2",
      hostId: "user-2",
      communityId: "commander-1",
      startDate: new Date("2024-12-21T18:00:00"),
      endDate: new Date("2024-12-21T22:00:00"),
      type: "casual",
      timezone: "America/New_York",
      maxAttendees: 20,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "casual",
      name: "Casual",
      icon: "fas fa-gamepad",
      color: "bg-blue-500",
    },
    user: mockUser,
    onEdit: fn(),
    onDelete: fn(),
    onJoinLeave: fn(),
    onGenerateGraphics: fn(),
    onLoginRequired: fn(),
  },
};

/**
 * Event with no user logged in
 */
export const NotLoggedIn: Story = {
  args: {
    event: {
      id: "3",
      title: "Draft Tournament",
      description: "Sealed booster draft with prize support.",
      location: "Local Card Shop",
      date: "2024-12-22",
      time: "2:00 PM",
      community: { name: "Draft Group", id: "draft-1" } as any,
      attendeeCount: 8,
      isUserAttending: false,
      mainPlayers: 8,
      alternates: 0,
      creator: { id: "user-3" },
      creatorId: "user-3",
      hostId: "user-3",
      communityId: "draft-1",
      startDate: new Date("2024-12-22T14:00:00"),
      endDate: new Date("2024-12-22T18:00:00"),
      type: "draft",
      timezone: "America/New_York",
      maxAttendees: 8,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "draft",
      name: "Draft",
      icon: "fas fa-cards",
      color: "bg-indigo-500",
    },
    user: null,
    onEdit: fn(),
    onDelete: fn(),
    onJoinLeave: fn(),
    onGenerateGraphics: fn(),
    onLoginRequired: fn(),
  },
};

/**
 * Large championship event with many attendees
 */
export const LargeEvent: Story = {
  args: {
    event: {
      id: "4",
      title: "Regional Championship",
      description: "Top players compete for prizes and qualification.",
      location: "Convention Center",
      date: "2024-12-28",
      time: "9:00 AM",
      community: { name: "Regional Circuit", id: "regional-1" } as any,
      attendeeCount: 128,
      isUserAttending: false,
      mainPlayers: 120,
      alternates: 8,
      creator: { id: "user-4" },
      creatorId: "user-4",
      hostId: "user-4",
      communityId: "regional-1",
      startDate: new Date("2024-12-28T09:00:00"),
      endDate: new Date("2024-12-28T20:00:00"),
      type: "tournament",
      timezone: "America/New_York",
      maxAttendees: 150,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "championship",
      name: "Championship",
      icon: "fas fa-crown",
      color: "bg-purple-600",
    },
    user: mockUser,
    onEdit: fn(),
    onDelete: fn(),
    onJoinLeave: fn(),
    onGenerateGraphics: fn(),
    onLoginRequired: fn(),
  },
};

/**
 * Event with waitlist (alternates)
 */
export const WithWaitlist: Story = {
  args: {
    event: {
      id: "5",
      title: "Limited Seats Draft",
      description: "Popular draft event with limited capacity.",
      location: "Small Venue",
      date: "2024-12-25",
      time: "4:00 PM",
      community: { name: "Elite Draft", id: "elite-1" } as any,
      attendeeCount: 10,
      isUserAttending: false,
      mainPlayers: 8,
      alternates: 2,
      creator: { id: "user-5" },
      creatorId: "user-5",
      hostId: "user-5",
      communityId: "elite-1",
      startDate: new Date("2024-12-25T16:00:00"),
      endDate: new Date("2024-12-25T20:00:00"),
      type: "draft",
      timezone: "America/New_York",
      maxAttendees: 8,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "draft",
      name: "Draft",
      icon: "fas fa-cards",
      color: "bg-teal-500",
    },
    user: mockUser,
    onEdit: fn(),
    onDelete: fn(),
    onJoinLeave: fn(),
    onGenerateGraphics: fn(),
    onLoginRequired: fn(),
  },
};
