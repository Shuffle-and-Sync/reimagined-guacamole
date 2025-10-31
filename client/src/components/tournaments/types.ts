/**
 * Shared types for tournament forms and dialogs
 */
export interface TournamentFormData {
  name: string;
  description: string;
  gameFormat: string;
  maxParticipants: number;
  startDate: string;
  prizePool: string;
  rules: string;
}
