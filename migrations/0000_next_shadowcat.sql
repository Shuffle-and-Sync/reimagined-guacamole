CREATE TABLE "collaboration_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"stream_session_id" varchar,
	"type" varchar NOT NULL,
	"message" text,
	"scheduled_time" timestamp,
	"status" varchar DEFAULT 'pending',
	"metadata" jsonb,
	"response_message" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"theme_color" varchar NOT NULL,
	"icon_class" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'attending',
	"role" varchar DEFAULT 'participant',
	"player_type" varchar DEFAULT 'main',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"date" varchar NOT NULL,
	"time" varchar NOT NULL,
	"location" varchar NOT NULL,
	"community_id" varchar,
	"creator_id" varchar NOT NULL,
	"host_id" varchar DEFAULT '' NOT NULL,
	"co_host_id" varchar,
	"max_attendees" integer,
	"is_public" boolean DEFAULT true,
	"status" varchar DEFAULT 'active',
	"player_slots" integer DEFAULT 4,
	"alternate_slots" integer DEFAULT 2,
	"game_format" varchar,
	"power_level" integer,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" varchar,
	"recurrence_interval" integer DEFAULT 1,
	"recurrence_end_date" varchar,
	"parent_event_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_post_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"category" varchar NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"last_reply_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"parent_reply_id" varchar,
	"like_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_reply_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reply_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" varchar NOT NULL,
	"addressee_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"host_id" varchar NOT NULL,
	"co_host_id" varchar,
	"status" varchar DEFAULT 'waiting',
	"current_players" integer DEFAULT 0,
	"max_players" integer NOT NULL,
	"spectators" integer DEFAULT 0,
	"game_data" jsonb,
	"community_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" varchar NOT NULL,
	"winner_id" varchar NOT NULL,
	"loser_id" varchar,
	"winner_score" integer NOT NULL,
	"loser_score" integer NOT NULL,
	"game_length" integer,
	"result_type" varchar DEFAULT 'normal',
	"notes" text,
	"reported_by_id" varchar NOT NULL,
	"verified_by_id" varchar,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matchmaking_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"selected_games" jsonb DEFAULT '["MTG"]'::jsonb,
	"selected_formats" jsonb DEFAULT '["commander"]'::jsonb,
	"power_level_min" integer DEFAULT 1,
	"power_level_max" integer DEFAULT 10,
	"playstyle" varchar DEFAULT 'any',
	"location" varchar,
	"online_only" boolean DEFAULT false,
	"availability" varchar DEFAULT 'any',
	"language" varchar DEFAULT 'english',
	"max_distance" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "matchmaking_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar,
	"event_id" varchar,
	"community_id" varchar,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'direct',
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"priority" varchar DEFAULT 'normal',
	"community_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_session_id" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"timestamp" timestamp NOT NULL,
	"viewer_count" integer DEFAULT 0,
	"chat_message_count" integer DEFAULT 0,
	"followers_gained" integer DEFAULT 0,
	"subscriptions_gained" integer DEFAULT 0,
	"donations_received" jsonb,
	"average_chat_sentiment" varchar,
	"top_chatters" jsonb,
	"stream_quality" varchar,
	"frame_drops" integer DEFAULT 0,
	"bitrate" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stream_session_co_hosts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_session_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar DEFAULT 'co_host',
	"permissions" jsonb DEFAULT '{"canControlStream":false,"canManageChat":true,"canInviteGuests":false,"canEndStream":false}'::jsonb,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stream_session_platforms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_session_id" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"platform_user_id" varchar,
	"platform_username" varchar,
	"stream_key" varchar,
	"is_active" boolean DEFAULT true,
	"is_live" boolean DEFAULT false,
	"viewer_count" integer DEFAULT 0,
	"chat_enabled" boolean DEFAULT true,
	"platform_metadata" jsonb,
	"last_status_check" timestamp,
	"connected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stream_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"scheduled_start_time" timestamp NOT NULL,
	"actual_start_time" timestamp,
	"end_time" timestamp,
	"status" varchar DEFAULT 'scheduled',
	"category" varchar NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"community_id" varchar,
	"is_public" boolean DEFAULT true,
	"auto_start_enabled" boolean DEFAULT false,
	"cross_platform_chat" boolean DEFAULT false,
	"recording_enabled" boolean DEFAULT false,
	"multistreaming" boolean DEFAULT false,
	"max_viewers" integer DEFAULT 0,
	"average_viewers" integer DEFAULT 0,
	"peak_viewers" integer DEFAULT 0,
	"total_view_time" integer DEFAULT 0,
	"session_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "theme_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"community_id" varchar,
	"theme_mode" varchar DEFAULT 'dark',
	"custom_colors" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_formats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"code" varchar NOT NULL,
	"description" text,
	"supports_seeding" boolean DEFAULT true,
	"requires_even_participants" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "tournament_formats_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tournament_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"round_id" varchar NOT NULL,
	"player1_id" varchar,
	"player2_id" varchar,
	"winner_id" varchar,
	"status" varchar DEFAULT 'pending',
	"game_session_id" varchar,
	"bracket_position" integer,
	"player1_score" integer DEFAULT 0,
	"player2_score" integer DEFAULT 0,
	"match_data" jsonb,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"seed" integer,
	"status" varchar DEFAULT 'registered',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_rounds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar NOT NULL,
	"round_number" integer NOT NULL,
	"name" varchar,
	"status" varchar DEFAULT 'pending',
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"game_format" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"organizer_id" varchar NOT NULL,
	"max_participants" integer DEFAULT 8,
	"current_participants" integer DEFAULT 0,
	"status" varchar DEFAULT 'upcoming',
	"start_date" timestamp,
	"end_date" timestamp,
	"bracket_data" jsonb,
	"prize_pool" varchar,
	"rules" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"data" jsonb,
	"is_public" boolean DEFAULT true,
	"community_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_communities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_gaming_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"rank" varchar,
	"experience" varchar,
	"favorite_deck" text,
	"achievements" jsonb,
	"statistics" jsonb,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"theme" varchar DEFAULT 'system',
	"notification_settings" jsonb DEFAULT '{"email":true,"browser":true,"eventReminders":true,"socialUpdates":false,"weeklyDigest":true}'::jsonb,
	"privacy_settings" jsonb DEFAULT '{"profileVisible":true,"showOnlineStatus":true,"allowDirectMessages":true,"shareStreamingActivity":true}'::jsonb,
	"streaming_settings" jsonb DEFAULT '{"defaultQuality":"720p","autoStartRecording":false,"chatOverlay":true,"showViewerCount":true}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_social_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"username" varchar NOT NULL,
	"url" varchar NOT NULL,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"primary_community" varchar,
	"username" varchar,
	"bio" text,
	"location" varchar,
	"website" varchar,
	"status" varchar DEFAULT 'offline',
	"status_message" varchar,
	"timezone" varchar,
	"date_of_birth" varchar,
	"is_private" boolean DEFAULT false,
	"show_online_status" varchar DEFAULT 'everyone',
	"allow_direct_messages" varchar DEFAULT 'everyone',
	"password_hash" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_stream_session_id_stream_sessions_id_fk" FOREIGN KEY ("stream_session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_co_host_id_users_id_fk" FOREIGN KEY ("co_host_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reply_likes" ADD CONSTRAINT "forum_reply_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_co_host_id_users_id_fk" FOREIGN KEY ("co_host_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_match_id_tournament_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."tournament_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_loser_id_users_id_fk" FOREIGN KEY ("loser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_reported_by_id_users_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_preferences" ADD CONSTRAINT "matchmaking_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_analytics" ADD CONSTRAINT "stream_analytics_stream_session_id_stream_sessions_id_fk" FOREIGN KEY ("stream_session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_session_co_hosts" ADD CONSTRAINT "stream_session_co_hosts_stream_session_id_stream_sessions_id_fk" FOREIGN KEY ("stream_session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_session_co_hosts" ADD CONSTRAINT "stream_session_co_hosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_session_platforms" ADD CONSTRAINT "stream_session_platforms_stream_session_id_stream_sessions_id_fk" FOREIGN KEY ("stream_session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_sessions" ADD CONSTRAINT "stream_sessions_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_sessions" ADD CONSTRAINT "stream_sessions_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_preferences" ADD CONSTRAINT "theme_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_preferences" ADD CONSTRAINT "theme_preferences_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_round_id_tournament_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."tournament_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_rounds" ADD CONSTRAINT "tournament_rounds_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_communities" ADD CONSTRAINT "user_communities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_communities" ADD CONSTRAINT "user_communities_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gaming_profiles" ADD CONSTRAINT "user_gaming_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gaming_profiles" ADD CONSTRAINT "user_gaming_profiles_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_social_links" ADD CONSTRAINT "user_social_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_collaboration_requests_from_user_id" ON "collaboration_requests" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_collaboration_requests_to_user_id" ON "collaboration_requests" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_collaboration_requests_stream_session_id" ON "collaboration_requests" USING btree ("stream_session_id");--> statement-breakpoint
CREATE INDEX "idx_collaboration_requests_status" ON "collaboration_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_event_attendees_event_id" ON "event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_attendees_user_id" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_attendees_composite" ON "event_attendees" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_events_creator_id" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_events_community_id" ON "events" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_forum_post_likes_post_id" ON "forum_post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_post_likes_user_id" ON "forum_post_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_author_id" ON "forum_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_community_id" ON "forum_posts" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_category" ON "forum_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_created_at" ON "forum_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_forum_replies_post_id" ON "forum_replies" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_replies_author_id" ON "forum_replies" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_replies_created_at" ON "forum_replies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_forum_reply_likes_reply_id" ON "forum_reply_likes" USING btree ("reply_id");--> statement-breakpoint
CREATE INDEX "idx_forum_reply_likes_user_id" ON "forum_reply_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_requester_id" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_addressee_id" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_status" ON "friendships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_host_id" ON "game_sessions" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_event_id" ON "game_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_community_id" ON "game_sessions" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_status" ON "game_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_match_results_match_id" ON "match_results" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_match_results_winner_id" ON "match_results" USING btree ("winner_id");--> statement-breakpoint
CREATE INDEX "idx_match_results_loser_id" ON "match_results" USING btree ("loser_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender_id" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_messages_recipient_id" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "messages" USING btree ("sender_id","recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_stream_analytics_session_id" ON "stream_analytics" USING btree ("stream_session_id");--> statement-breakpoint
CREATE INDEX "idx_stream_analytics_platform" ON "stream_analytics" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_stream_analytics_timestamp" ON "stream_analytics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_stream_session_co_hosts_session_id" ON "stream_session_co_hosts" USING btree ("stream_session_id");--> statement-breakpoint
CREATE INDEX "idx_stream_session_co_hosts_user_id" ON "stream_session_co_hosts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_stream_session_platforms_session_id" ON "stream_session_platforms" USING btree ("stream_session_id");--> statement-breakpoint
CREATE INDEX "idx_stream_session_platforms_platform" ON "stream_session_platforms" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_stream_session_platforms_is_live" ON "stream_session_platforms" USING btree ("is_live");--> statement-breakpoint
CREATE INDEX "idx_stream_sessions_host_user_id" ON "stream_sessions" USING btree ("host_user_id");--> statement-breakpoint
CREATE INDEX "idx_stream_sessions_community_id" ON "stream_sessions" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_stream_sessions_status" ON "stream_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stream_sessions_scheduled_start" ON "stream_sessions" USING btree ("scheduled_start_time");--> statement-breakpoint
CREATE INDEX "idx_tournament_matches_tournament_id" ON "tournament_matches" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_matches_round_id" ON "tournament_matches" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_matches_status" ON "tournament_matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tournament_matches_player1_id" ON "tournament_matches" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_matches_player2_id" ON "tournament_matches" USING btree ("player2_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_participants_tournament_id" ON "tournament_participants" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_participants_user_id" ON "tournament_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_rounds_tournament_id" ON "tournament_rounds" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_rounds_status" ON "tournament_rounds" USING btree ("status");