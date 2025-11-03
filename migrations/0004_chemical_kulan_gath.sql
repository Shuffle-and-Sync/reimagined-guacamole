CREATE TABLE `calendar_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` integer,
	`calendar_id` text,
	`calendar_name` text,
	`sync_enabled` integer DEFAULT true,
	`last_sync_at` integer,
	`sync_direction` text DEFAULT 'both',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_calendar_connections_user` ON `calendar_connections` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_calendar_connections_provider` ON `calendar_connections` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_calendar_connections_sync_enabled` ON `calendar_connections` (`sync_enabled`);--> statement-breakpoint
CREATE TABLE `event_reminder_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_type` text,
	`reminder_times` text DEFAULT '[60, 1440]' NOT NULL,
	`channels` text DEFAULT '["email", "in_app"]' NOT NULL,
	`is_enabled` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_reminder_settings_user_id_unique` ON `event_reminder_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_event_reminder_settings_user` ON `event_reminder_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_event_reminder_settings_enabled` ON `event_reminder_settings` (`is_enabled`);--> statement-breakpoint
CREATE TABLE `event_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reminder_time` integer NOT NULL,
	`minutes_before` integer NOT NULL,
	`channels` text NOT NULL,
	`status` text DEFAULT 'pending',
	`sent_at` integer,
	`failure_reason` text,
	`notification_id` text,
	`created_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_event_reminders_event` ON `event_reminders` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_event_reminders_user` ON `event_reminders` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_event_reminders_time` ON `event_reminders` (`reminder_time`);--> statement-breakpoint
CREATE INDEX `idx_event_reminders_status` ON `event_reminders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_event_reminders_status_time` ON `event_reminders` (`status`,`reminder_time`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_event_user_time` ON `event_reminders` (`event_id`,`user_id`,`minutes_before`);--> statement-breakpoint
CREATE TABLE `event_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`previous_status` text,
	`new_status` text NOT NULL,
	`changed_by` text,
	`reason` text,
	`changed_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_event_status_history_event` ON `event_status_history` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_event_status_history_changed_at` ON `event_status_history` (`changed_at`);--> statement-breakpoint
CREATE INDEX `idx_event_status_history_changed_by` ON `event_status_history` (`changed_by`);--> statement-breakpoint
CREATE INDEX `idx_event_status_history_event_time` ON `event_status_history` (`event_id`,`changed_at`);--> statement-breakpoint
CREATE TABLE `external_events` (
	`id` text PRIMARY KEY NOT NULL,
	`connection_id` text NOT NULL,
	`external_event_id` text NOT NULL,
	`internal_event_id` text,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`timezone` text DEFAULT 'UTC',
	`is_all_day` integer DEFAULT false,
	`status` text DEFAULT 'confirmed',
	`raw_data` text,
	`last_synced_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`connection_id`) REFERENCES `calendar_connections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`internal_event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_external_events_connection` ON `external_events` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_external_events_internal` ON `external_events` (`internal_event_id`);--> statement-breakpoint
CREATE INDEX `idx_external_events_start_time` ON `external_events` (`start_time`);--> statement-breakpoint
CREATE INDEX `idx_external_events_status` ON `external_events` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `external_events_connection_id_external_event_id_unique` ON `external_events` (`connection_id`,`external_event_id`);--> statement-breakpoint
CREATE TABLE `session_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`inviter_id` text NOT NULL,
	`invitee_id` text NOT NULL,
	`role` text DEFAULT 'player' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`expires_at` integer NOT NULL,
	`responded_at` integer,
	`created_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invitee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_session_invitations_session` ON `session_invitations` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_invitations_inviter` ON `session_invitations` (`inviter_id`);--> statement-breakpoint
CREATE INDEX `idx_session_invitations_invitee` ON `session_invitations` (`invitee_id`);--> statement-breakpoint
CREATE INDEX `idx_session_invitations_status` ON `session_invitations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_session_invitations_invitee_status` ON `session_invitations` (`invitee_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_session_invitations_session_status` ON `session_invitations` (`session_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_session_invitee_pending` ON `session_invitations` (`session_id`,`invitee_id`,`status`);--> statement-breakpoint
CREATE TABLE `user_bans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`banned_by` text NOT NULL,
	`reason` text NOT NULL,
	`scope` text NOT NULL,
	`scope_id` text,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`banned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_bans_user_id` ON `user_bans` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_bans_scope` ON `user_bans` (`scope`);--> statement-breakpoint
CREATE INDEX `idx_user_bans_scope_id` ON `user_bans` (`scope_id`);--> statement-breakpoint
CREATE INDEX `idx_user_bans_active` ON `user_bans` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_user_bans_end_time` ON `user_bans` (`end_time`);--> statement-breakpoint
CREATE INDEX `idx_user_bans_user_active` ON `user_bans` (`user_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_user_bans_scope_scope_id` ON `user_bans` (`scope`,`scope_id`);--> statement-breakpoint
ALTER TABLE `event_attendees` ADD `waitlist_position` integer;--> statement-breakpoint
ALTER TABLE `event_attendees` ADD `slot_type` text;--> statement-breakpoint
ALTER TABLE `event_attendees` ADD `slot_position` integer;--> statement-breakpoint
ALTER TABLE `event_attendees` ADD `assigned_at` integer;--> statement-breakpoint
ALTER TABLE `event_attendees` ADD `registered_at` integer;--> statement-breakpoint
CREATE INDEX `idx_event_attendees_waitlist` ON `event_attendees` (`event_id`,`waitlist_position`);--> statement-breakpoint
CREATE INDEX `idx_event_attendees_slot_type` ON `event_attendees` (`event_id`,`slot_type`);--> statement-breakpoint
CREATE INDEX `idx_event_attendees_slot_position` ON `event_attendees` (`event_id`,`slot_type`,`slot_position`);--> statement-breakpoint
ALTER TABLE `events` ADD `timezone` text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `display_timezone` text;--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `visibility` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `password` text;--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `allow_spectators` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `max_spectators` integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `require_approval` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_game_sessions_visibility` ON `game_sessions` (`visibility`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_community_visibility` ON `game_sessions` (`community_id`,`visibility`);