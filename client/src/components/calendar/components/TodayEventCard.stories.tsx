import { TodayEventCard } from "./TodayEventCard";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * TodayEventCard displays a compact event card for today's events.
 *
 * Features:
 * - Visual indicator (orange left border) to highlight today's events
 * - Event type icon and color coding
 * - Community badge
 * - Time display
 * - Location and attendee count
 * - Memoized to prevent unnecessary re-renders
 *
 * @example
 * ```tsx
 * <TodayEventCard
 *   event={{
 *     id: '1',
 *     title: 'Magic: The Gathering Tournament',
 *     description: 'Standard format tournament',
 *     location: 'Game Store',
 *     time: '2:00 PM',
 *     community: { name: 'Magic Players' },
 *     attendeeCount: 24,
 *   }}
 * />
 * ```
 */
const meta = {
  title: "Calendar/TodayEventCard",
  component: TodayEventCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TodayEventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Standard tournament event happening today
 */
export const TournamentEvent: Story = {
  args: {
    event: {
      id: "1",
      title: "Magic: The Gathering Standard Tournament",
      description:
        "Join us for an exciting Standard format tournament! Prizes for top 8.",
      location: "Local Game Store",
      time: "2:00 PM",
      community: { name: "Magic Players", id: "magic-1" } as any,
      attendeeCount: 24,
      creatorId: "user-1",
      communityId: "magic-1",
      startTime: new Date(),
      endTime: new Date(),
      type: "tournament",
      status: "active",
      timezone: "America/New_York",
      displayTimezone: null,
      isVirtual: false,
      isPublic: true,
      isRecurring: false,
      maxAttendees: 32,
      playerSlots: null,
      alternateSlots: null,
      gameFormat: null,
      powerLevel: null,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      parentEventId: null,
      hostId: null,
      coHostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "tournament",
      name: "Tournament",
      icon: "fas fa-trophy",
      color: "bg-yellow-500",
    },
  },
};

/**
 * Casual game night event
 */
export const CasualGameNight: Story = {
  args: {
    event: {
      id: "2",
      title: "Commander Night",
      description:
        "Casual Commander games all evening. Bring your favorite decks!",
      location: "Community Center",
      time: "6:00 PM",
      community: { name: "Commander League", id: "commander-1" } as any,
      attendeeCount: 12,
      creatorId: "user-2",
      communityId: "commander-1",
      startTime: new Date(),
      endTime: new Date(),
      type: "community",
      status: "active",
      timezone: "America/New_York",
      displayTimezone: null,
      isVirtual: false,
      isPublic: true,
      isRecurring: false,
      maxAttendees: 20,
      playerSlots: null,
      alternateSlots: null,
      gameFormat: null,
      powerLevel: null,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      parentEventId: null,
      hostId: null,
      coHostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "casual",
      name: "Casual",
      icon: "fas fa-gamepad",
      color: "bg-blue-500",
    },
  },
};

/**
 * Large scale championship event
 */
export const ChampionshipEvent: Story = {
  args: {
    event: {
      id: "3",
      title: "Regional Championship Finals",
      description:
        "Top players compete for the regional title and qualification for nationals.",
      location: "Convention Center Hall A",
      time: "10:00 AM",
      community: { name: "Regional Circuit", id: "regional-1" } as any,
      attendeeCount: 256,
      creatorId: "user-3",
      communityId: "regional-1",
      startTime: new Date(),
      endTime: new Date(),
      type: "tournament",
      status: "active",
      timezone: "America/New_York",
      displayTimezone: null,
      isVirtual: false,
      isPublic: true,
      isRecurring: false,
      maxAttendees: 300,
      playerSlots: null,
      alternateSlots: null,
      gameFormat: null,
      powerLevel: null,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      parentEventId: null,
      hostId: null,
      coHostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "championship",
      name: "Championship",
      icon: "fas fa-crown",
      color: "bg-purple-600",
    },
  },
};

/**
 * Event without community assigned
 */
export const NoCommunity: Story = {
  args: {
    event: {
      id: "4",
      title: "Open Play Session",
      description: "Drop in anytime for casual games.",
      location: "Game Shop",
      time: "1:00 PM",
      community: null,
      attendeeCount: 8,
      creatorId: "user-4",
      communityId: null,
      startTime: new Date(),
      endTime: new Date(),
      type: "community",
      status: "active",
      timezone: "America/New_York",
      displayTimezone: null,
      isVirtual: false,
      isPublic: true,
      isRecurring: false,
      maxAttendees: null,
      playerSlots: null,
      alternateSlots: null,
      gameFormat: null,
      powerLevel: null,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      parentEventId: null,
      hostId: null,
      coHostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "casual",
      name: "Casual",
      icon: "fas fa-gamepad",
      color: "bg-green-500",
    },
  },
};

/**
 * Event with minimal attendees
 */
export const SmallEvent: Story = {
  args: {
    event: {
      id: "5",
      title: "Draft Pod",
      description: "Small draft pod, need 8 players.",
      location: "Coffee Shop",
      time: "3:30 PM",
      community: { name: "Draft Group", id: "draft-1" } as any,
      attendeeCount: 5,
      creatorId: "user-5",
      communityId: "draft-1",
      startTime: new Date(),
      endTime: new Date(),
      type: "game_pod",
      status: "active",
      timezone: "America/New_York",
      displayTimezone: null,
      isVirtual: false,
      isPublic: true,
      isRecurring: false,
      maxAttendees: 8,
      playerSlots: null,
      alternateSlots: null,
      gameFormat: null,
      powerLevel: null,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      parentEventId: null,
      hostId: null,
      coHostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    eventType: {
      id: "draft",
      name: "Draft",
      icon: "fas fa-cards",
      color: "bg-indigo-500",
    },
  },
};
