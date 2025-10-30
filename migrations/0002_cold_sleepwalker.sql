-- Auto-generated migration by Drizzle Kit
-- Note: SQLite uses INTEGER for boolean fields (0 = false, 1 = true)
-- Fields with "integer DEFAULT true" are boolean fields defaulting to 1 (true)

CREATE TABLE `game_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`action_data` text NOT NULL,
	`target_id` text,
	`result_data` text,
	`state_version` integer,
	`is_valid` integer DEFAULT true,
	`validation_error` text,
	`timestamp` integer,
	`created_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_game_actions_session` ON `game_actions` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_user` ON `game_actions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_type` ON `game_actions` (`action_type`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_timestamp` ON `game_actions` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_created` ON `game_actions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_session_timestamp` ON `game_actions` (`session_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_session_user_timestamp` ON `game_actions` (`session_id`,`user_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_game_actions_session_type_timestamp` ON `game_actions` (`session_id`,`action_type`,`timestamp`);--> statement-breakpoint
CREATE TABLE `game_state_history` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`version` integer NOT NULL,
	`state` text NOT NULL,
	`state_hash` text,
	`changed_by` text,
	`change_type` text,
	`change_description` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_game_state_history_session` ON `game_state_history` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_game_state_history_version` ON `game_state_history` (`version`);--> statement-breakpoint
CREATE INDEX `idx_game_state_history_created` ON `game_state_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_game_state_history_session_version` ON `game_state_history` (`session_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_game_state_history_session_created` ON `game_state_history` (`session_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_session_version` ON `game_state_history` (`session_id`,`version`);--> statement-breakpoint
CREATE TABLE `match_result_conflicts` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`submission1_id` text NOT NULL,
	`submission2_id` text NOT NULL,
	`submission1_by` text NOT NULL,
	`submission2_by` text NOT NULL,
	`submission1_data` text NOT NULL,
	`submission2_data` text NOT NULL,
	`status` text DEFAULT 'pending',
	`resolution` text,
	`resolved_by` text,
	`resolved_at` integer,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`match_id`) REFERENCES `tournament_matches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission1_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submission2_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_match_conflicts_match` ON `match_result_conflicts` (`match_id`);--> statement-breakpoint
CREATE INDEX `idx_match_conflicts_status` ON `match_result_conflicts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_match_conflicts_created` ON `match_result_conflicts` (`created_at`);--> statement-breakpoint
CREATE TABLE `platform_api_circuit_breakers` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`endpoint` text NOT NULL,
	`state` text NOT NULL,
	`failure_count` integer DEFAULT 0,
	`success_count` integer DEFAULT 0,
	`last_failure_at` integer,
	`last_success_at` integer,
	`state_changed_at` integer,
	`next_retry_at` integer,
	`metadata` text DEFAULT '{}',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_circuit_breakers_platform` ON `platform_api_circuit_breakers` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_circuit_breakers_state` ON `platform_api_circuit_breakers` (`state`);--> statement-breakpoint
CREATE UNIQUE INDEX `platform_api_circuit_breakers_platform_endpoint_unique` ON `platform_api_circuit_breakers` (`platform`,`endpoint`);--> statement-breakpoint
CREATE TABLE `player_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_type` text NOT NULL,
	`format` text,
	`rating` integer DEFAULT 1500,
	`peak` integer DEFAULT 1500,
	`wins` integer DEFAULT 0,
	`losses` integer DEFAULT 0,
	`draws` integer DEFAULT 0,
	`win_streak` integer DEFAULT 0,
	`longest_win_streak` integer DEFAULT 0,
	`games_played` integer DEFAULT 0,
	`last_game_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_player_ratings_user` ON `player_ratings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_player_ratings_game` ON `player_ratings` (`game_type`);--> statement-breakpoint
CREATE INDEX `idx_player_ratings_rating` ON `player_ratings` (`rating`);--> statement-breakpoint
CREATE UNIQUE INDEX `player_ratings_user_id_game_type_format_unique` ON `player_ratings` (`user_id`,`game_type`,`format`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`user_agent` text,
	`device_info` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`last_used` integer,
	`expires_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_user` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_endpoint` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_active` ON `push_subscriptions` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_user_active` ON `push_subscriptions` (`user_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `tournament_seeds` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`seed` integer NOT NULL,
	`seed_score` real,
	`bracket_position` integer,
	`elo_rating` integer,
	`recent_win_rate` real,
	`tournament_history` integer,
	`manual_seed` integer,
	`seeding_algorithm` text,
	`seeding_metadata` text,
	`created_at` integer,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tournament_seeds_tournament` ON `tournament_seeds` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_seeds_participant` ON `tournament_seeds` (`participant_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_seeds_seed` ON `tournament_seeds` (`seed`);--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_seeds_tournament_id_participant_id_unique` ON `tournament_seeds` (`tournament_id`,`participant_id`);--> statement-breakpoint
ALTER TABLE `events` ADD `is_public` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `events` ADD `game_format` text;--> statement-breakpoint
ALTER TABLE `events` ADD `power_level` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `is_recurring` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `events` ADD `recurrence_pattern` text;--> statement-breakpoint
ALTER TABLE `events` ADD `recurrence_interval` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `recurrence_end_date` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `parent_event_id` text;--> statement-breakpoint
CREATE INDEX `idx_events_is_public` ON `events` (`is_public`);--> statement-breakpoint
CREATE INDEX `idx_events_game_format` ON `events` (`game_format`);--> statement-breakpoint
CREATE INDEX `idx_events_is_recurring` ON `events` (`is_recurring`);--> statement-breakpoint
CREATE INDEX `idx_events_parent` ON `events` (`parent_event_id`);--> statement-breakpoint
ALTER TABLE `notifications` ADD `action_url` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `action_text` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `notifications` ADD `read` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `result_submitted_at` integer;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `result_submitted_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `conflict_detected_at` integer;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `conflict_resolved_at` integer;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `conflict_resolution` text;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `bracket_type` text;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `bracket_position` integer;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `is_grand_finals` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `is_bracket_reset` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `bracket_structure` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `seeding_algorithm` text DEFAULT 'random';--> statement-breakpoint
CREATE INDEX `idx_game_sessions_community` ON `game_sessions` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_created_at` ON `game_sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_status_created` ON `game_sessions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_community_status` ON `game_sessions` (`community_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_host_status` ON `game_sessions` (`host_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_community_status_created` ON `game_sessions` (`community_id`,`status`,`created_at`);