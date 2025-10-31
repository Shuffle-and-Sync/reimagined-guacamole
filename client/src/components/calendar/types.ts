/**
 * Calendar event types configuration
 */
export interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const EVENT_TYPES: EventType[] = [
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
