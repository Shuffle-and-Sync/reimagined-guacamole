CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_provider_account_id_unique` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text NOT NULL,
	`action` text NOT NULL,
	`category` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`target_identifier` text,
	`old_values` text,
	`new_values` text,
	`parameters` text,
	`ip_address` text NOT NULL,
	`user_agent` text,
	`session_id` text,
	`success` integer DEFAULT true,
	`error_message` text,
	`impact_assessment` text,
	`created_at` integer,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_admin_audit_log_admin` ON `admin_audit_log` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_audit_log_action` ON `admin_audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_admin_audit_log_category` ON `admin_audit_log` (`category`);--> statement-breakpoint
CREATE INDEX `idx_admin_audit_log_target` ON `admin_audit_log` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_audit_log_created` ON `admin_audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_admin_audit_log_ip` ON `admin_audit_log` (`ip_address`);--> statement-breakpoint
CREATE TABLE `auth_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event_type` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`is_successful` integer,
	`failure_reason` text,
	`details` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_auth_audit_user` ON `auth_audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_audit_event` ON `auth_audit_log` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_auth_audit_created` ON `auth_audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `ban_evasion_tracking` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`hashed_fingerprint` text,
	`user_agent` text,
	`screen_resolution` text,
	`timezone` text,
	`language` text,
	`login_patterns` text,
	`activity_signature` text,
	`detection_method` text,
	`confidence_score` real,
	`related_banned_user` text,
	`status` text DEFAULT 'flagged',
	`investigated_by` text,
	`investigated_at` integer,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_banned_user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`investigated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ban_evasion_user` ON `ban_evasion_tracking` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ban_evasion_ip` ON `ban_evasion_tracking` (`ip_address`);--> statement-breakpoint
CREATE INDEX `idx_ban_evasion_fingerprint` ON `ban_evasion_tracking` (`hashed_fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_ban_evasion_status` ON `ban_evasion_tracking` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ban_evasion_confidence` ON `ban_evasion_tracking` (`confidence_score`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`game_id` text NOT NULL,
	`type` text,
	`rarity` text,
	`set_code` text,
	`set_name` text,
	`image_url` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_cards_game` ON `cards` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_cards_name` ON `cards` (`name`);--> statement-breakpoint
CREATE INDEX `idx_cards_set_code` ON `cards` (`set_code`);--> statement-breakpoint
CREATE INDEX `idx_cards_game_name` ON `cards` (`game_id`,`name`);--> statement-breakpoint
CREATE TABLE `cms_content` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_published` integer DEFAULT false,
	`published_at` integer,
	`scheduled_publish_at` integer,
	`author_id` text NOT NULL,
	`last_edited_by` text NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`change_log` text,
	`previous_version_id` text,
	`meta_description` text,
	`meta_keywords` text,
	`slug` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_edited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cms_content_slug_unique` ON `cms_content` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_cms_content_type` ON `cms_content` (`type`);--> statement-breakpoint
CREATE INDEX `idx_cms_content_published` ON `cms_content` (`is_published`);--> statement-breakpoint
CREATE INDEX `idx_cms_content_author` ON `cms_content` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_cms_content_scheduled` ON `cms_content` (`scheduled_publish_at`);--> statement-breakpoint
CREATE INDEX `idx_cms_content_version` ON `cms_content` (`type`,`version`);--> statement-breakpoint
CREATE TABLE `collaboration_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`event_id` text,
	`message` text,
	`status` text DEFAULT 'pending',
	`expires_at` integer,
	`created_at` integer,
	`responded_at` integer,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_collaboration_requests_from` ON `collaboration_requests` (`from_user_id`);--> statement-breakpoint
CREATE INDEX `idx_collaboration_requests_to` ON `collaboration_requests` (`to_user_id`);--> statement-breakpoint
CREATE INDEX `idx_collaboration_requests_event` ON `collaboration_requests` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_collaboration_requests_status` ON `collaboration_requests` (`status`);--> statement-breakpoint
CREATE TABLE `collaborative_stream_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`scheduled_start_time` integer NOT NULL,
	`estimated_duration` integer,
	`community_id` text,
	`creator_id` text NOT NULL,
	`organizer_id` text NOT NULL,
	`status` text DEFAULT 'planned',
	`streaming_platforms` text DEFAULT '[]',
	`content_type` text,
	`target_audience` text,
	`max_collaborators` integer,
	`requires_approval` integer DEFAULT true,
	`is_private` integer DEFAULT false,
	`tags` text DEFAULT '[]',
	`actual_start_time` integer,
	`actual_end_time` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_collab_stream_events_organizer` ON `collaborative_stream_events` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `idx_collab_stream_events_creator` ON `collaborative_stream_events` (`creator_id`);--> statement-breakpoint
CREATE INDEX `idx_collab_stream_events_community` ON `collaborative_stream_events` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_collab_stream_events_start` ON `collaborative_stream_events` (`scheduled_start_time`);--> statement-breakpoint
CREATE INDEX `idx_collab_stream_events_status` ON `collaborative_stream_events` (`status`);--> statement-breakpoint
CREATE TABLE `communities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`theme_color` text NOT NULL,
	`icon_class` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communities_name_unique` ON `communities` (`name`);--> statement-breakpoint
CREATE TABLE `community_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`community_id` text NOT NULL,
	`metric_type` text NOT NULL,
	`value` integer DEFAULT 0,
	`metadata` text DEFAULT '{}',
	`date` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_community_analytics_community` ON `community_analytics` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_community_analytics_metric` ON `community_analytics` (`metric_type`);--> statement-breakpoint
CREATE INDEX `idx_community_analytics_date` ON `community_analytics` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_analytics_community_id_metric_type_date_unique` ON `community_analytics` (`community_id`,`metric_type`,`date`);--> statement-breakpoint
CREATE TABLE `content_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_user_id` text,
	`reported_user_id` text,
	`content_type` text NOT NULL,
	`content_id` text NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`evidence` text,
	`is_system_generated` integer DEFAULT false,
	`automated_flags` text,
	`confidence_score` real,
	`status` text DEFAULT 'pending',
	`priority` text DEFAULT 'medium',
	`assigned_moderator` text,
	`moderation_notes` text,
	`resolution` text,
	`action_taken` text,
	`created_at` integer,
	`resolved_at` integer,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_moderator`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_content_reports_reporter` ON `content_reports` (`reporter_user_id`);--> statement-breakpoint
CREATE INDEX `idx_content_reports_reported` ON `content_reports` (`reported_user_id`);--> statement-breakpoint
CREATE INDEX `idx_content_reports_status` ON `content_reports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_content_reports_priority` ON `content_reports` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_content_reports_assigned` ON `content_reports` (`assigned_moderator`);--> statement-breakpoint
CREATE INDEX `idx_content_reports_content` ON `content_reports` (`content_type`,`content_id`);--> statement-breakpoint
CREATE INDEX `idx_content_reports_status_type_created` ON `content_reports` (`status`,`content_type`,`created_at`);--> statement-breakpoint
CREATE TABLE `conversion_funnels` (
	`id` text PRIMARY KEY NOT NULL,
	`funnel_name` text NOT NULL,
	`step_name` text NOT NULL,
	`step_order` integer NOT NULL,
	`user_id` text,
	`session_id` text,
	`completed` integer DEFAULT false,
	`completed_at` integer,
	`metadata` text DEFAULT '{}',
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_conversion_funnel_name` ON `conversion_funnels` (`funnel_name`);--> statement-breakpoint
CREATE INDEX `idx_conversion_funnel_user` ON `conversion_funnels` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_conversion_funnel_session` ON `conversion_funnels` (`session_id`);--> statement-breakpoint
CREATE TABLE `device_fingerprints` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`fingerprint_hash` text NOT NULL,
	`device_info` text DEFAULT '{}',
	`first_seen` integer,
	`last_seen` integer,
	`trust_score` real DEFAULT 0.5,
	`is_blocked` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_device_fingerprints_user` ON `device_fingerprints` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_device_fingerprints_hash` ON `device_fingerprints` (`fingerprint_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `device_fingerprints_user_id_fingerprint_hash_unique` ON `device_fingerprints` (`user_id`,`fingerprint_hash`);--> statement-breakpoint
CREATE TABLE `email_change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_email` text NOT NULL,
	`new_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verification_code` text,
	`expires_at` integer NOT NULL,
	`initiated_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_email_change_user` ON `email_change_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_email_change_status` ON `email_change_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_email_change_new_email` ON `email_change_requests` (`new_email`);--> statement-breakpoint
CREATE TABLE `email_change_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`token` text NOT NULL,
	`type` text NOT NULL,
	`is_used` integer DEFAULT false,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer,
	FOREIGN KEY (`request_id`) REFERENCES `email_change_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_change_tokens_token_unique` ON `email_change_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_email_change_token_request` ON `email_change_tokens` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_email_change_token_token` ON `email_change_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`verified_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_token_unique` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_email_verification_token` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_email_verification_user` ON `email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `event_attendees` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'attending',
	`role` text DEFAULT 'participant',
	`player_type` text DEFAULT 'main',
	`joined_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_event_attendees_event` ON `event_attendees` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_event_attendees_user` ON `event_attendees` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_attendees_event_id_user_id_unique` ON `event_attendees` (`event_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `event_tracking` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event_name` text NOT NULL,
	`event_category` text NOT NULL,
	`event_properties` text DEFAULT '{}',
	`session_id` text,
	`ip_address` text,
	`user_agent` text,
	`timestamp` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_event_tracking_user` ON `event_tracking` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_event_tracking_name` ON `event_tracking` (`event_name`);--> statement-breakpoint
CREATE INDEX `idx_event_tracking_category` ON `event_tracking` (`event_category`);--> statement-breakpoint
CREATE INDEX `idx_event_tracking_timestamp` ON `event_tracking` (`timestamp`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'active',
	`start_time` integer NOT NULL,
	`end_time` integer,
	`location` text,
	`is_virtual` integer DEFAULT false,
	`max_attendees` integer,
	`player_slots` integer,
	`alternate_slots` integer,
	`creator_id` text NOT NULL,
	`host_id` text,
	`co_host_id` text,
	`community_id` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`co_host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_creator` ON `events` (`creator_id`);--> statement-breakpoint
CREATE INDEX `idx_events_community` ON `events` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_events_start_time` ON `events` (`start_time`);--> statement-breakpoint
CREATE INDEX `idx_events_status` ON `events` (`status`);--> statement-breakpoint
CREATE INDEX `idx_events_type` ON `events` (`type`);--> statement-breakpoint
CREATE TABLE `forum_post_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_forum_post_likes_post` ON `forum_post_likes` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_forum_post_likes_user` ON `forum_post_likes` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `forum_post_likes_post_id_user_id_unique` ON `forum_post_likes` (`post_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`community_id` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`tags` text DEFAULT '[]',
	`is_pinned` integer DEFAULT false,
	`is_locked` integer DEFAULT false,
	`view_count` integer DEFAULT 0,
	`like_count` integer DEFAULT 0,
	`reply_count` integer DEFAULT 0,
	`last_activity_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_forum_posts_author` ON `forum_posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_forum_posts_community` ON `forum_posts` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_forum_posts_category` ON `forum_posts` (`category`);--> statement-breakpoint
CREATE INDEX `idx_forum_posts_activity` ON `forum_posts` (`last_activity_at`);--> statement-breakpoint
CREATE TABLE `forum_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`parent_reply_id` text,
	`like_count` integer DEFAULT 0,
	`is_edited` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_forum_replies_post` ON `forum_replies` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_forum_replies_author` ON `forum_replies` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_forum_replies_parent` ON `forum_replies` (`parent_reply_id`);--> statement-breakpoint
CREATE TABLE `forum_reply_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`reply_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`reply_id`) REFERENCES `forum_replies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_forum_reply_likes_reply` ON `forum_reply_likes` (`reply_id`);--> statement-breakpoint
CREATE INDEX `idx_forum_reply_likes_user` ON `forum_reply_likes` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `forum_reply_likes_reply_id_user_id_unique` ON `forum_reply_likes` (`reply_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`friend_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`addressee_id` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	`responded_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`addressee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_friendships_user` ON `friendships` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_friendships_friend` ON `friendships` (`friend_id`);--> statement-breakpoint
CREATE INDEX `idx_friendships_status` ON `friendships` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `friendships_user_id_friend_id_unique` ON `friendships` (`user_id`,`friend_id`);--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`game_type` text NOT NULL,
	`community_id` text,
	`status` text DEFAULT 'waiting',
	`max_players` integer,
	`current_players` integer DEFAULT 0,
	`spectators` text DEFAULT '[]',
	`host_id` text NOT NULL,
	`co_host_id` text,
	`board_state` text,
	`game_data` text,
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`co_host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_game_sessions_event` ON `game_sessions` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_host` ON `game_sessions` (`host_id`);--> statement-breakpoint
CREATE INDEX `idx_game_sessions_status` ON `game_sessions` (`status`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_name_unique` ON `games` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `games_code_unique` ON `games` (`code`);--> statement-breakpoint
CREATE INDEX `idx_games_name` ON `games` (`name`);--> statement-breakpoint
CREATE INDEX `idx_games_code` ON `games` (`code`);--> statement-breakpoint
CREATE INDEX `idx_games_active` ON `games` (`is_active`);--> statement-breakpoint
CREATE TABLE `match_results` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`winner_id` text,
	`loser_id` text,
	`player1_score` integer,
	`player2_score` integer,
	`player1_deck` text,
	`player2_deck` text,
	`duration_minutes` integer,
	`notes` text,
	`reported_by` text NOT NULL,
	`reported_by_id` text,
	`is_verified` integer DEFAULT false,
	`verified_by` text,
	`verified_by_id` text,
	`created_at` integer,
	FOREIGN KEY (`match_id`) REFERENCES `tournament_matches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loser_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `match_results_match_id_unique` ON `match_results` (`match_id`);--> statement-breakpoint
CREATE INDEX `idx_match_results_match` ON `match_results` (`match_id`);--> statement-breakpoint
CREATE INDEX `idx_match_results_reporter` ON `match_results` (`reported_by`);--> statement-breakpoint
CREATE TABLE `matchmaking_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_type` text NOT NULL,
	`preferred_formats` text DEFAULT '[]',
	`skill_level_range` text DEFAULT '[]',
	`availability_schedule` text DEFAULT '{}',
	`max_travel_distance` integer,
	`preferred_location` text,
	`play_style` text,
	`communication_preferences` text DEFAULT '{}',
	`blocked_users` text DEFAULT '[]',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matchmaking_preferences_user_id_unique` ON `matchmaking_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_matchmaking_prefs_user` ON `matchmaking_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_matchmaking_prefs_game` ON `matchmaking_preferences` (`game_type`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text,
	`recipient_id` text,
	`event_id` text,
	`community_id` text,
	`content` text NOT NULL,
	`is_read` integer DEFAULT false,
	`read_at` integer,
	`created_at` integer,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_sender` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_receiver` ON `messages` (`receiver_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_event` ON `messages` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_created` ON `messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `mfa_security_context` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`context_type` text NOT NULL,
	`ip_address` text NOT NULL,
	`location` text,
	`device_fingerprint` text,
	`risk_level` text DEFAULT 'low',
	`requires_mfa` integer DEFAULT false,
	`mfa_completed` integer DEFAULT false,
	`is_successful` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mfa_context_user` ON `mfa_security_context` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_mfa_context_type` ON `mfa_security_context` (`context_type`);--> statement-breakpoint
CREATE INDEX `idx_mfa_context_created` ON `mfa_security_context` (`created_at`);--> statement-breakpoint
CREATE TABLE `moderation_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`moderator_id` text NOT NULL,
	`target_user_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`duration` integer,
	`related_content_type` text,
	`related_content_id` text,
	`related_report_id` text,
	`is_reversible` integer DEFAULT true,
	`is_public` integer DEFAULT false,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`admin_notes` text,
	`is_active` integer DEFAULT true,
	`reversed_by` text,
	`reversed_at` integer,
	`reversal_reason` text,
	`expires_at` integer,
	`created_at` integer,
	FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_report_id`) REFERENCES `content_reports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reversed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_moderator` ON `moderation_actions` (`moderator_id`);--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_target` ON `moderation_actions` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_action` ON `moderation_actions` (`action`);--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_active` ON `moderation_actions` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_expires` ON `moderation_actions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_created` ON `moderation_actions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_moderation_actions_target_action_active` ON `moderation_actions` (`target_user_id`,`action`,`is_active`);--> statement-breakpoint
CREATE TABLE `moderation_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`priority` integer DEFAULT 5,
	`status` text DEFAULT 'open',
	`assigned_moderator` text,
	`assigned_at` integer,
	`risk_score` real,
	`user_reputation_score` integer,
	`reporter_reputation_score` integer,
	`ml_priority` integer,
	`auto_generated` integer DEFAULT false,
	`summary` text,
	`tags` text DEFAULT '[]',
	`estimated_time_minutes` integer,
	`metadata` text,
	`resolution` text,
	`action_taken` text,
	`created_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`assigned_moderator`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_moderation_queue_status` ON `moderation_queue` (`status`);--> statement-breakpoint
CREATE INDEX `idx_moderation_queue_priority` ON `moderation_queue` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_moderation_queue_assigned` ON `moderation_queue` (`assigned_moderator`);--> statement-breakpoint
CREATE INDEX `idx_moderation_queue_created` ON `moderation_queue` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_moderation_queue_item` ON `moderation_queue` (`item_type`,`item_id`);--> statement-breakpoint
CREATE INDEX `idx_moderation_queue_status_priority_created` ON `moderation_queue` (`status`,`priority`,`created_at`);--> statement-breakpoint
CREATE TABLE `moderation_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`subject` text,
	`content` text NOT NULL,
	`variables` text DEFAULT '[]',
	`is_active` integer DEFAULT true,
	`created_by` text NOT NULL,
	`last_modified_by` text NOT NULL,
	`usage_count` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_modified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_moderation_templates_category` ON `moderation_templates` (`category`);--> statement-breakpoint
CREATE INDEX `idx_moderation_templates_active` ON `moderation_templates` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_moderation_templates_creator` ON `moderation_templates` (`created_by`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`priority` text DEFAULT 'normal',
	`title` text NOT NULL,
	`message` text,
	`data` text,
	`is_read` integer DEFAULT false,
	`read_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_type` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `idx_notifications_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_created` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_token` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_user` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `platform_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`metric_name` text NOT NULL,
	`metric_value` real NOT NULL,
	`metric_type` text NOT NULL,
	`tags` text DEFAULT '{}',
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `idx_platform_metrics_name` ON `platform_metrics` (`metric_name`);--> statement-breakpoint
CREATE INDEX `idx_platform_metrics_timestamp` ON `platform_metrics` (`timestamp`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`device_info` text DEFAULT '{}',
	`ip_address` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_used` integer,
	`is_revoked` integer DEFAULT false,
	`revoked_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_unique` ON `refresh_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_refresh_tokens_user` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_refresh_tokens_token` ON `refresh_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_refresh_tokens_expires` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `revoked_jwt_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`jti` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`reason` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `revoked_jwt_tokens_jti_unique` ON `revoked_jwt_tokens` (`jti`);--> statement-breakpoint
CREATE INDEX `idx_revoked_jwt_jti` ON `revoked_jwt_tokens` (`jti`);--> statement-breakpoint
CREATE INDEX `idx_revoked_jwt_user` ON `revoked_jwt_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_revoked_jwt_expires` ON `revoked_jwt_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `stream_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`viewer_count` integer DEFAULT 0,
	`peak_viewers` integer DEFAULT 0,
	`average_viewers` integer DEFAULT 0,
	`chat_messages` integer DEFAULT 0,
	`likes` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`duration_minutes` integer DEFAULT 0,
	`timestamp` integer,
	FOREIGN KEY (`session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stream_analytics_session` ON `stream_analytics` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_analytics_user` ON `stream_analytics` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_analytics_timestamp` ON `stream_analytics` (`timestamp`);--> statement-breakpoint
CREATE TABLE `stream_collaborators` (
	`id` text PRIMARY KEY NOT NULL,
	`stream_event_id` text NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'pending',
	`platform_handles` text DEFAULT '{}',
	`streaming_capabilities` text DEFAULT '[]',
	`available_time_slots` text DEFAULT '{}',
	`content_specialties` text DEFAULT '[]',
	`technical_setup` text DEFAULT '{}',
	`invited_by_user_id` text,
	`invited_by` text,
	`invited_at` integer,
	`responded_at` integer,
	`joined_at` integer,
	`left_at` integer,
	FOREIGN KEY (`stream_event_id`) REFERENCES `collaborative_stream_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `collaborative_stream_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stream_collaborators_stream_event` ON `stream_collaborators` (`stream_event_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_collaborators_event` ON `stream_collaborators` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_collaborators_user` ON `stream_collaborators` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_collaborators_status` ON `stream_collaborators` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `stream_collaborators_event_id_user_id_unique` ON `stream_collaborators` (`event_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `stream_coordination_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`stream_event_id` text NOT NULL,
	`event_id` text NOT NULL,
	`current_phase` text DEFAULT 'preparation',
	`current_host` text,
	`current_host_id` text,
	`active_collaborators` text DEFAULT '[]',
	`platform_statuses` text DEFAULT '{}',
	`viewer_counts` text DEFAULT '{}',
	`coordination_events` text DEFAULT '[]',
	`chat_moderation_active` integer DEFAULT false,
	`stream_quality_settings` text DEFAULT '{}',
	`audio_coordination` text DEFAULT '{}',
	`stream_metrics` text DEFAULT '{}',
	`phase_history` text DEFAULT '[]',
	`notes` text,
	`actual_start_time` integer,
	`actual_end_time` integer,
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`stream_event_id`) REFERENCES `collaborative_stream_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `collaborative_stream_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_host`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stream_coordination_stream_event` ON `stream_coordination_sessions` (`stream_event_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_coordination_event` ON `stream_coordination_sessions` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_coordination_phase` ON `stream_coordination_sessions` (`current_phase`);--> statement-breakpoint
CREATE TABLE `stream_session_co_hosts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`stream_session_id` text,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'co_host',
	`joined_at` integer,
	`left_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stream_session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stream_co_hosts_session` ON `stream_session_co_hosts` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_co_hosts_user` ON `stream_session_co_hosts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stream_session_co_hosts_session_id_user_id_unique` ON `stream_session_co_hosts` (`session_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `stream_session_platforms` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`stream_session_id` text,
	`platform` text NOT NULL,
	`stream_url` text,
	`stream_key` text,
	`status` text DEFAULT 'idle',
	`viewer_count` integer DEFAULT 0,
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stream_session_id`) REFERENCES `stream_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stream_platforms_session` ON `stream_session_platforms` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_platforms_platform` ON `stream_session_platforms` (`platform`);--> statement-breakpoint
CREATE TABLE `stream_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'scheduled',
	`streamer_id` text NOT NULL,
	`host_user_id` text,
	`event_id` text,
	`community_id` text,
	`scheduled_start` integer,
	`scheduled_start_time` integer,
	`actual_start` integer,
	`actual_end` integer,
	`viewer_count` integer DEFAULT 0,
	`peak_viewers` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`streamer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`host_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stream_sessions_streamer` ON `stream_sessions` (`streamer_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_sessions_event` ON `stream_sessions` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_sessions_status` ON `stream_sessions` (`status`);--> statement-breakpoint
CREATE TABLE `theme_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`community_id` text,
	`theme_mode` text DEFAULT 'dark',
	`custom_colors` text,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournament_formats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`game_type` text NOT NULL,
	`description` text,
	`rules` text DEFAULT '{}',
	`structure` text NOT NULL,
	`default_rounds` integer,
	`is_official` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_tournament_formats_game` ON `tournament_formats` (`game_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_formats_name_game_type_unique` ON `tournament_formats` (`name`,`game_type`);--> statement-breakpoint
CREATE TABLE `tournament_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`round_id` text NOT NULL,
	`match_number` integer NOT NULL,
	`player1_id` text,
	`player2_id` text,
	`winner_id` text,
	`status` text DEFAULT 'pending',
	`table_number` integer,
	`start_time` integer,
	`end_time` integer,
	`created_at` integer,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `tournament_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player1_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player2_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_tournament` ON `tournament_matches` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_round` ON `tournament_matches` (`round_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_matches_players` ON `tournament_matches` (`player1_id`,`player2_id`);--> statement-breakpoint
CREATE TABLE `tournament_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'registered',
	`seed` integer,
	`final_rank` integer,
	`joined_at` integer,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tournament_participants_tournament` ON `tournament_participants` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_participants_user` ON `tournament_participants` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_participants_tournament_id_user_id_unique` ON `tournament_participants` (`tournament_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `tournament_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`name` text,
	`status` text DEFAULT 'pending',
	`start_time` integer,
	`end_time` integer,
	`created_at` integer,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tournament_rounds_tournament` ON `tournament_rounds` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `idx_tournament_rounds_number` ON `tournament_rounds` (`tournament_id`,`round_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_rounds_tournament_id_round_number_unique` ON `tournament_rounds` (`tournament_id`,`round_number`);--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`game_type` text NOT NULL,
	`format` text NOT NULL,
	`status` text DEFAULT 'upcoming',
	`max_participants` integer,
	`current_participants` integer DEFAULT 0,
	`prize_pool` real,
	`organizer_id` text NOT NULL,
	`community_id` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tournaments_organizer` ON `tournaments` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `idx_tournaments_community` ON `tournaments` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_tournaments_status` ON `tournaments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tournaments_start_date` ON `tournaments` (`start_date`);--> statement-breakpoint
CREATE TABLE `trusted_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_fingerprint_id` text NOT NULL,
	`device_name` text,
	`name` text,
	`description` text,
	`trust_level` text DEFAULT 'standard',
	`auto_trust_mfa` integer DEFAULT false,
	`trust_duration_days` integer DEFAULT 30,
	`total_logins` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`verified_at` integer,
	`verification_method` text,
	`trusted_at` integer,
	`last_used` integer,
	`last_used_at` integer,
	`expires_at` integer,
	`is_revoked` integer DEFAULT false,
	`revoked_at` integer,
	`revoked_reason` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_fingerprint_id`) REFERENCES `device_fingerprints`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_trusted_devices_user` ON `trusted_devices` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_trusted_devices_fingerprint` ON `trusted_devices` (`device_fingerprint_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `trusted_devices_user_id_device_fingerprint_id_unique` ON `trusted_devices` (`user_id`,`device_fingerprint_id`);--> statement-breakpoint
CREATE TABLE `user_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`type` text,
	`title` text,
	`description` text,
	`data` text,
	`metadata` text,
	`community_id` text,
	`is_public` integer DEFAULT true,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_activities_user` ON `user_activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_activities_type` ON `user_activities` (`activity_type`);--> statement-breakpoint
CREATE INDEX `idx_user_activities_created` ON `user_activities` (`created_at`);--> statement-breakpoint
CREATE TABLE `user_activity_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`count` integer DEFAULT 1,
	`metadata` text DEFAULT '{}',
	`date` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_activity_user` ON `user_activity_analytics` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_activity_type` ON `user_activity_analytics` (`activity_type`);--> statement-breakpoint
CREATE INDEX `idx_user_activity_date` ON `user_activity_analytics` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_activity_analytics_user_id_activity_type_date_unique` ON `user_activity_analytics` (`user_id`,`activity_type`,`date`);--> statement-breakpoint
CREATE TABLE `user_appeals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`moderation_action_id` text NOT NULL,
	`reason` text NOT NULL,
	`evidence` text,
	`additional_info` text,
	`status` text DEFAULT 'pending',
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_notes` text,
	`decision` text,
	`decision_reason` text,
	`response_to_user` text,
	`is_user_notified` integer DEFAULT false,
	`can_reappeal` integer DEFAULT false,
	`reappeal_cooldown_until` integer,
	`resolved_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moderation_action_id`) REFERENCES `moderation_actions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_appeals_user` ON `user_appeals` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_appeals_action` ON `user_appeals` (`moderation_action_id`);--> statement-breakpoint
CREATE INDEX `idx_user_appeals_status` ON `user_appeals` (`status`);--> statement-breakpoint
CREATE INDEX `idx_user_appeals_reviewer` ON `user_appeals` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `idx_user_appeals_created` ON `user_appeals` (`created_at`);--> statement-breakpoint
CREATE TABLE `user_communities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`community_id` text NOT NULL,
	`is_primary` integer DEFAULT false,
	`joined_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_communities_user_id` ON `user_communities` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_communities_community_id` ON `user_communities` (`community_id`);--> statement-breakpoint
CREATE INDEX `idx_user_communities_primary` ON `user_communities` (`user_id`,`is_primary`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_community` ON `user_communities` (`user_id`,`community_id`);--> statement-breakpoint
CREATE TABLE `user_gaming_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_type` text NOT NULL,
	`community_id` text,
	`player_id` text,
	`username` text,
	`skill_level` text,
	`rank` text,
	`experience` integer DEFAULT 0,
	`favorite_deck` text,
	`preferred_formats` text DEFAULT '[]',
	`achievements` text DEFAULT '[]',
	`statistics` text DEFAULT '{}',
	`is_public` integer DEFAULT true,
	`is_visible` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_gaming_profiles_user` ON `user_gaming_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_gaming_profiles_game` ON `user_gaming_profiles` (`game_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_gaming_profiles_user_id_game_type_unique` ON `user_gaming_profiles` (`user_id`,`game_type`);--> statement-breakpoint
CREATE TABLE `user_mfa_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`attempt_type` text NOT NULL,
	`success` integer NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text,
	`failure_reason` text,
	`failed_attempts` integer DEFAULT 0,
	`locked_until` integer,
	`window_started_at` integer,
	`last_failed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mfa_attempts_user` ON `user_mfa_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_mfa_attempts_created` ON `user_mfa_attempts` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_mfa_attempts_success` ON `user_mfa_attempts` (`success`);--> statement-breakpoint
CREATE TABLE `user_mfa_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`secret` text NOT NULL,
	`backup_codes` text,
	`enabled` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_mfa_settings_user_id_unique` ON `user_mfa_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_platform_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`handle` text NOT NULL,
	`platform_user_id` text,
	`channel_id` text,
	`page_id` text,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` integer,
	`scopes` text,
	`is_active` integer DEFAULT true,
	`last_verified` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_platform_user_id` ON `user_platform_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_platform` ON `user_platform_accounts` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_active` ON `user_platform_accounts` (`user_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_handle` ON `user_platform_accounts` (`handle`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_token_expires` ON `user_platform_accounts` (`token_expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_platform_accounts_user_id_platform_unique` ON `user_platform_accounts` (`user_id`,`platform`);--> statement-breakpoint
CREATE TABLE `user_reputation` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`score` integer DEFAULT 100,
	`level` text DEFAULT 'new',
	`positive_actions` integer DEFAULT 0,
	`negative_actions` integer DEFAULT 0,
	`reports_made` integer DEFAULT 0,
	`reports_accurate` integer DEFAULT 0,
	`moderation_history` text DEFAULT '[]',
	`last_calculated` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_reputation_user_id` ON `user_reputation` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_reputation_score` ON `user_reputation` (`score`);--> statement-breakpoint
CREATE INDEX `idx_user_reputation_level` ON `user_reputation` (`level`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`community_id` text,
	`assigned_by` text NOT NULL,
	`is_active` integer DEFAULT true,
	`expires_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_roles_user_id` ON `user_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_roles_role` ON `user_roles` (`role`);--> statement-breakpoint
CREATE INDEX `idx_user_roles_community` ON `user_roles` (`community_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_role_community` ON `user_roles` (`user_id`,`role`,`community_id`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`notifications_enabled` integer DEFAULT true,
	`email_notifications` integer DEFAULT true,
	`push_notifications` integer DEFAULT false,
	`notification_types` text DEFAULT '{}',
	`privacy_settings` text DEFAULT '{}',
	`display_preferences` text DEFAULT '{}',
	`language` text DEFAULT 'en',
	`timezone` text DEFAULT 'UTC',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_settings_user` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_social_links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`url` text NOT NULL,
	`display_name` text,
	`is_verified` integer DEFAULT false,
	`is_public` integer DEFAULT true,
	`order_index` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_social_links_user` ON `user_social_links` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_social_links_platform` ON `user_social_links` (`platform`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`primary_community` text,
	`username` text,
	`bio` text,
	`location` text,
	`website` text,
	`status` text DEFAULT 'offline',
	`status_message` text,
	`timezone` text,
	`date_of_birth` text,
	`is_private` integer DEFAULT false,
	`show_online_status` text DEFAULT 'everyone',
	`allow_direct_messages` text DEFAULT 'everyone',
	`password_hash` text,
	`is_email_verified` integer DEFAULT false,
	`email_verified_at` integer,
	`failed_login_attempts` integer DEFAULT 0,
	`last_failed_login` integer,
	`account_locked_until` integer,
	`password_changed_at` integer,
	`mfa_enabled` integer DEFAULT false,
	`mfa_enabled_at` integer,
	`last_login_at` integer,
	`last_active_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `idx_users_primary_community` ON `users` (`primary_community`);--> statement-breakpoint
CREATE INDEX `idx_users_created_at` ON `users` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_users_last_active` ON `users` (`last_active_at`);--> statement-breakpoint
CREATE INDEX `idx_users_last_login` ON `users` (`last_login_at`);--> statement-breakpoint
CREATE INDEX `idx_users_status_last_active` ON `users` (`status`,`last_active_at`);--> statement-breakpoint
CREATE INDEX `idx_users_community_status` ON `users` (`primary_community`,`status`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_identifier_token_unique` ON `verification_tokens` (`identifier`,`token`);