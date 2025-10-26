CREATE INDEX `idx_event_attendees_event_status` ON `event_attendees` (`event_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_event_attendees_user_status` ON `event_attendees` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_events_community_status_start` ON `events` (`community_id`,`status`,`start_time`);--> statement-breakpoint
CREATE INDEX `idx_events_status_type_start` ON `events` (`status`,`type`,`start_time`);--> statement-breakpoint
CREATE INDEX `idx_friendships_addressee_pending` ON `friendships` (`addressee_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_friendships_requester_status` ON `friendships` (`requester_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_games_created_at` ON `games` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_match_results_winner` ON `match_results` (`winner_id`);--> statement-breakpoint
CREATE INDEX `idx_match_results_loser` ON `match_results` (`loser_id`);--> statement-breakpoint
CREATE INDEX `idx_match_results_created_at` ON `match_results` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_match_results_winner_created` ON `match_results` (`winner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_user_unread_created` ON `notifications` (`user_id`,`is_read`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_user_type_created` ON `notifications` (`user_id`,`type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_stream_sessions_status_community` ON `stream_sessions` (`status`,`community_id`,`scheduled_start`);--> statement-breakpoint
CREATE INDEX `idx_stream_sessions_streamer_status` ON `stream_sessions` (`streamer_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_player1` ON `tournament_matches` (`player1_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_player2` ON `tournament_matches` (`player2_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_status` ON `tournament_matches` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_created_at` ON `tournament_matches` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_tournament_created` ON `tournament_matches` (`tournament_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tournament_participants_tournament_status` ON `tournament_participants` (`tournament_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_user_platform_active` ON `user_platform_accounts` (`user_id`,`platform`,`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_community_status_active` ON `users` (`primary_community`,`status`,`last_active_at`);