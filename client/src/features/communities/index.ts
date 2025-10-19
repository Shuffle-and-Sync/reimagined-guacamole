// Communities feature exports
export { CommunityCard } from "./components/CommunityCard";
export {
  CommunityProvider,
  useCommunity,
} from "./components/CommunityProvider";
export {
  getCommunityTheme,
  applyCommunityTheme,
  type CommunityTheme,
} from "./utils/communityThemes";

// Re-export realm dashboards
export { BladeforgeDashboard } from "./components/realm-dashboards/BladeforgeDashboard";
export { DeckmasterDashboard } from "./components/realm-dashboards/DeckmasterDashboard";
export { DecksongDashboard } from "./components/realm-dashboards/DecksongDashboard";
export { DuelcraftDashboard } from "./components/realm-dashboards/DuelcraftDashboard";
export { PokeStreamDashboard } from "./components/realm-dashboards/PokeStreamDashboard";
export { ScryGatherDashboard } from "./components/realm-dashboards/ScryGatherDashboard";
