import type { Event, Community } from "@shared/schema";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location: string;
  playerSlots: number;
  alternateSlots: number;
  gameFormat: string;
  powerLevel: number;
  creator: any;
  creatorId: string;
  attendeeCount: number;
  mainPlayers: number;
  alternates: number;
}

export interface ExtendedEvent extends Event {
  creator: any;
  community: Community | null;
  attendeeCount: number;
  isUserAttending?: boolean;
}

export interface Attendee {
  userId: string;
  eventId: string;
  status: string;
  role: string;
  playerType: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const EVENT_TYPES = [
  {
    id: "tournament",
    name: "Tournament",
    icon: "fas fa-trophy",
    color: "bg-yellow-500",
  },
  {
    id: "convention",
    name: "Convention",
    icon: "fas fa-building",
    color: "bg-purple-500",
  },
  {
    id: "release",
    name: "Product Release",
    icon: "fas fa-box",
    color: "bg-blue-500",
  },
  {
    id: "game_pod",
    name: "Game Pod",
    icon: "fas fa-gamepad",
    color: "bg-red-500",
  },
  {
    id: "community",
    name: "Community Event",
    icon: "fas fa-users",
    color: "bg-green-500",
  },
];

export const GAME_FORMATS = [
  { id: "commander", name: "Commander", icon: "fas fa-crown" },
  { id: "standard", name: "Standard", icon: "fas fa-shield-alt" },
  { id: "limited", name: "Limited", icon: "fas fa-box" },
  { id: "legacy", name: "Legacy", icon: "fas fa-scroll" },
  { id: "modern", name: "Modern", icon: "fas fa-bolt" },
  { id: "draft", name: "Draft", icon: "fas fa-random" },
];

export const POWER_LEVELS = [
  { value: 1, label: "Casual (1-2)", description: "Precons and simple decks" },
  { value: 3, label: "Focused (3-4)", description: "Some synergy and power" },
  {
    value: 5,
    label: "Optimized (5-6)",
    description: "Strong synergy and efficiency",
  },
  {
    value: 7,
    label: "High Power (7-8)",
    description: "Fast mana and powerful plays",
  },
  {
    value: 9,
    label: "cEDH (9-10)",
    description: "Competitive tournament level",
  },
];
