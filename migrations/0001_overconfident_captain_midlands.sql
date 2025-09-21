CREATE TABLE "admin_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"category" varchar NOT NULL,
	"target_type" varchar,
	"target_id" varchar,
	"target_identifier" varchar,
	"old_values" jsonb,
	"new_values" jsonb,
	"parameters" jsonb,
	"ip_address" varchar NOT NULL,
	"user_agent" text,
	"session_id" varchar,
	"success" boolean DEFAULT true,
	"error_message" text,
	"impact_assessment" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ban_evasion_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ip_address" varchar NOT NULL,
	"hashed_fingerprint" varchar,
	"user_agent" text,
	"screen_resolution" varchar,
	"timezone" varchar,
	"language" varchar,
	"login_patterns" jsonb,
	"activity_signature" jsonb,
	"detection_method" varchar,
	"confidence_score" numeric,
	"related_banned_user" varchar,
	"status" varchar DEFAULT 'flagged',
	"investigated_by" varchar,
	"investigated_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"scheduled_publish_at" timestamp,
	"author_id" varchar NOT NULL,
	"last_edited_by" varchar NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"change_log" text,
	"previous_version_id" varchar,
	"meta_description" text,
	"meta_keywords" text,
	"slug" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cms_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collaborative_stream_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"scheduled_start_time" timestamp with time zone NOT NULL,
	"estimated_duration" integer NOT NULL,
	"creator_id" varchar NOT NULL,
	"community_id" varchar,
	"streaming_platforms" text[] NOT NULL,
	"content_type" varchar NOT NULL,
	"target_audience" varchar NOT NULL,
	"max_collaborators" integer DEFAULT 4,
	"requires_approval" boolean DEFAULT true,
	"allow_viewer_participation" boolean DEFAULT false,
	"coordination_mode" varchar DEFAULT 'host_led',
	"stream_key" varchar,
	"chat_coordination" jsonb,
	"status" varchar DEFAULT 'planning',
	"ai_matching_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" varchar NOT NULL,
	"date" date NOT NULL,
	"hour" integer,
	"active_users" integer DEFAULT 0,
	"new_members" integer DEFAULT 0,
	"total_members" integer DEFAULT 0,
	"streams_started" integer DEFAULT 0,
	"total_stream_time" integer DEFAULT 0,
	"collaborations_created" integer DEFAULT 0,
	"tournaments_created" integer DEFAULT 0,
	"forum_posts" integer DEFAULT 0,
	"forum_replies" integer DEFAULT 0,
	"avg_session_duration" integer DEFAULT 0,
	"retention_rate" numeric,
	"engagement_score" numeric,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_community_date_hour" UNIQUE("community_id","date","hour")
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" varchar,
	"reported_user_id" varchar,
	"content_type" varchar NOT NULL,
	"content_id" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"description" text,
	"evidence" jsonb,
	"is_system_generated" boolean DEFAULT false,
	"automated_flags" jsonb,
	"confidence_score" numeric,
	"status" varchar DEFAULT 'pending',
	"priority" varchar DEFAULT 'medium',
	"assigned_moderator" varchar,
	"moderation_notes" text,
	"resolution" varchar,
	"action_taken" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "conversion_funnels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"funnel_name" varchar NOT NULL,
	"step_name" varchar NOT NULL,
	"step_order" integer NOT NULL,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"completed" boolean DEFAULT false,
	"time_spent" integer,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"anonymous_id" varchar,
	"event_name" varchar NOT NULL,
	"event_source" varchar NOT NULL,
	"properties" jsonb,
	"traits" jsonb,
	"context" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moderator_id" varchar NOT NULL,
	"target_user_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"reason" text NOT NULL,
	"duration" integer,
	"related_content_type" varchar,
	"related_content_id" varchar,
	"related_report_id" varchar,
	"is_reversible" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" varchar,
	"admin_notes" text,
	"is_active" boolean DEFAULT true,
	"reversed_by" varchar,
	"reversed_at" timestamp,
	"reversal_reason" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moderation_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_type" varchar NOT NULL,
	"item_id" varchar NOT NULL,
	"priority" integer DEFAULT 5,
	"status" varchar DEFAULT 'open',
	"assigned_moderator" varchar,
	"assigned_at" timestamp,
	"risk_score" numeric,
	"user_reputation_score" integer,
	"reporter_reputation_score" integer,
	"summary" text,
	"tags" text[] DEFAULT '{}',
	"estimated_time_minutes" integer,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "moderation_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"subject" varchar,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"last_modified_by" varchar NOT NULL,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar NOT NULL,
	"metric_name" varchar NOT NULL,
	"metric_value" numeric NOT NULL,
	"metric_unit" varchar,
	"aggregation_type" varchar NOT NULL,
	"time_window" varchar NOT NULL,
	"tags" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_collaborators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_event_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"status" varchar DEFAULT 'invited',
	"invited_by_user_id" varchar,
	"platform_handles" jsonb,
	"streaming_capabilities" text[],
	"available_time_slots" jsonb,
	"content_specialties" text[],
	"technical_setup" jsonb,
	"invited_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"joined_at" timestamp,
	CONSTRAINT "unique_collaborator_per_event" UNIQUE("stream_event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "stream_coordination_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_event_id" varchar NOT NULL,
	"actual_start_time" timestamp with time zone,
	"actual_end_time" timestamp with time zone,
	"current_phase" varchar DEFAULT 'preparation',
	"active_collaborators" text[],
	"current_host" varchar,
	"platform_statuses" jsonb,
	"viewer_counts" jsonb,
	"coordination_events" jsonb,
	"chat_moderation_active" boolean DEFAULT false,
	"stream_quality_settings" jsonb,
	"audio_coordination" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_id" varchar,
	"event_type" varchar NOT NULL,
	"event_category" varchar NOT NULL,
	"event_action" varchar NOT NULL,
	"event_label" varchar,
	"event_value" integer,
	"page_url" varchar,
	"referrer_url" varchar,
	"user_agent" varchar,
	"ip_address" varchar,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_appeals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"moderation_action_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"evidence" jsonb,
	"additional_info" text,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"decision" varchar,
	"decision_reason" text,
	"response_to_user" text,
	"is_user_notified" boolean DEFAULT false,
	"can_reappeal" boolean DEFAULT false,
	"reappeal_cooldown_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_platform_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"handle" varchar NOT NULL,
	"platform_user_id" varchar,
	"channel_id" varchar,
	"page_id" varchar,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_verified" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_platform_accounts_user_id_platform_unique" UNIQUE("user_id","platform")
);
--> statement-breakpoint
CREATE TABLE "user_reputation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"score" integer DEFAULT 100,
	"level" varchar DEFAULT 'new',
	"positive_actions" integer DEFAULT 0,
	"negative_actions" integer DEFAULT 0,
	"reports_made" integer DEFAULT 0,
	"reports_accurate" integer DEFAULT 0,
	"moderation_history" jsonb DEFAULT '[]'::jsonb,
	"last_calculated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"community_id" varchar,
	"assigned_by" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_role_community" UNIQUE("user_id","role","community_id")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "notification_settings" SET DEFAULT '{"browser":true,"email":true,"push":false,"sms":false,"webhook":false,"streamStarted":{"browser":true,"email":false,"push":true,"sms":false},"streamEnded":{"browser":true,"email":false,"push":false,"sms":false},"collaborationInvite":{"browser":true,"email":true,"push":true,"sms":false},"raidIncoming":{"browser":true,"email":false,"push":true,"sms":false},"eventReminders":{"browser":true,"email":true,"push":true,"sms":false},"friendRequests":{"browser":true,"email":true,"push":false,"sms":false},"socialUpdates":{"browser":false,"email":false,"push":false,"sms":false},"tournamentUpdates":{"browser":true,"email":true,"push":true,"sms":false},"systemAnnouncements":{"browser":true,"email":true,"push":false,"sms":false},"weeklyDigest":{"browser":false,"email":true,"push":false,"sms":false},"digestFrequency":"weekly","quietHours":{"enabled":false,"start":"22:00","end":"08:00"},"timezone":"UTC","groupNotifications":true,"soundEnabled":true,"vibrationEnabled":true,"showPreview":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban_evasion_tracking" ADD CONSTRAINT "ban_evasion_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban_evasion_tracking" ADD CONSTRAINT "ban_evasion_tracking_related_banned_user_users_id_fk" FOREIGN KEY ("related_banned_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban_evasion_tracking" ADD CONSTRAINT "ban_evasion_tracking_investigated_by_users_id_fk" FOREIGN KEY ("investigated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborative_stream_events" ADD CONSTRAINT "collaborative_stream_events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborative_stream_events" ADD CONSTRAINT "collaborative_stream_events_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_analytics" ADD CONSTRAINT "community_analytics_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_assigned_moderator_users_id_fk" FOREIGN KEY ("assigned_moderator") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversion_funnels" ADD CONSTRAINT "conversion_funnels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tracking" ADD CONSTRAINT "event_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_related_report_id_content_reports_id_fk" FOREIGN KEY ("related_report_id") REFERENCES "public"."content_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_reversed_by_users_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_assigned_moderator_users_id_fk" FOREIGN KEY ("assigned_moderator") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_templates" ADD CONSTRAINT "moderation_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_templates" ADD CONSTRAINT "moderation_templates_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_collaborators" ADD CONSTRAINT "stream_collaborators_stream_event_id_collaborative_stream_events_id_fk" FOREIGN KEY ("stream_event_id") REFERENCES "public"."collaborative_stream_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_collaborators" ADD CONSTRAINT "stream_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_collaborators" ADD CONSTRAINT "stream_collaborators_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_coordination_sessions" ADD CONSTRAINT "stream_coordination_sessions_stream_event_id_collaborative_stream_events_id_fk" FOREIGN KEY ("stream_event_id") REFERENCES "public"."collaborative_stream_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_coordination_sessions" ADD CONSTRAINT "stream_coordination_sessions_current_host_users_id_fk" FOREIGN KEY ("current_host") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_analytics" ADD CONSTRAINT "user_activity_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_appeals" ADD CONSTRAINT "user_appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_appeals" ADD CONSTRAINT "user_appeals_moderation_action_id_moderation_actions_id_fk" FOREIGN KEY ("moderation_action_id") REFERENCES "public"."moderation_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_appeals" ADD CONSTRAINT "user_appeals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_accounts" ADD CONSTRAINT "user_platform_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reputation" ADD CONSTRAINT "user_reputation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_admin" ON "admin_audit_log" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_action" ON "admin_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_category" ON "admin_audit_log" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_target" ON "admin_audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_created" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_ip" ON "admin_audit_log" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_ban_evasion_user" ON "ban_evasion_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ban_evasion_ip" ON "ban_evasion_tracking" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_ban_evasion_fingerprint" ON "ban_evasion_tracking" USING btree ("hashed_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_ban_evasion_status" ON "ban_evasion_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ban_evasion_confidence" ON "ban_evasion_tracking" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "idx_cms_content_type" ON "cms_content" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_cms_content_published" ON "cms_content" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_cms_content_author" ON "cms_content" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_cms_content_scheduled" ON "cms_content" USING btree ("scheduled_publish_at");--> statement-breakpoint
CREATE INDEX "idx_cms_content_version" ON "cms_content" USING btree ("type","version");--> statement-breakpoint
CREATE INDEX "idx_collab_stream_events_creator" ON "collaborative_stream_events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_collab_stream_events_community" ON "collaborative_stream_events" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_collab_stream_events_start_time" ON "collaborative_stream_events" USING btree ("scheduled_start_time");--> statement-breakpoint
CREATE INDEX "idx_collab_stream_events_status" ON "collaborative_stream_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_community_analytics_community_id" ON "community_analytics" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_community_analytics_date" ON "community_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_community_analytics_hour" ON "community_analytics" USING btree ("hour");--> statement-breakpoint
CREATE INDEX "idx_content_reports_reporter" ON "content_reports" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "idx_content_reports_reported" ON "content_reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "idx_content_reports_status" ON "content_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_reports_priority" ON "content_reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_content_reports_assigned" ON "content_reports" USING btree ("assigned_moderator");--> statement-breakpoint
CREATE INDEX "idx_content_reports_content" ON "content_reports" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "idx_content_reports_status_type_created" ON "content_reports" USING btree ("status","content_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_conversion_funnels_funnel_name" ON "conversion_funnels" USING btree ("funnel_name");--> statement-breakpoint
CREATE INDEX "idx_conversion_funnels_step_name" ON "conversion_funnels" USING btree ("step_name");--> statement-breakpoint
CREATE INDEX "idx_conversion_funnels_user_id" ON "conversion_funnels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_funnels_session_id" ON "conversion_funnels" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_funnels_timestamp" ON "conversion_funnels" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_event_tracking_user_id" ON "event_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_tracking_anonymous_id" ON "event_tracking" USING btree ("anonymous_id");--> statement-breakpoint
CREATE INDEX "idx_event_tracking_event_name" ON "event_tracking" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_event_tracking_event_source" ON "event_tracking" USING btree ("event_source");--> statement-breakpoint
CREATE INDEX "idx_event_tracking_timestamp" ON "event_tracking" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_moderator" ON "moderation_actions" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_target" ON "moderation_actions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_action" ON "moderation_actions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_active" ON "moderation_actions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_expires" ON "moderation_actions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_created" ON "moderation_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_target_action_active" ON "moderation_actions" USING btree ("target_user_id","action","is_active");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_status" ON "moderation_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_priority" ON "moderation_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_assigned" ON "moderation_queue" USING btree ("assigned_moderator");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_created" ON "moderation_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_item" ON "moderation_queue" USING btree ("item_type","item_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_status_priority_created" ON "moderation_queue" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_templates_category" ON "moderation_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_moderation_templates_active" ON "moderation_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_moderation_templates_creator" ON "moderation_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_platform_metrics_metric_type" ON "platform_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_platform_metrics_metric_name" ON "platform_metrics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "idx_platform_metrics_timestamp" ON "platform_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_platform_metrics_time_window" ON "platform_metrics" USING btree ("time_window");--> statement-breakpoint
CREATE INDEX "idx_stream_collaborators_event" ON "stream_collaborators" USING btree ("stream_event_id");--> statement-breakpoint
CREATE INDEX "idx_stream_collaborators_user" ON "stream_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_stream_collaborators_status" ON "stream_collaborators" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stream_coord_sessions_event" ON "stream_coordination_sessions" USING btree ("stream_event_id");--> statement-breakpoint
CREATE INDEX "idx_stream_coord_sessions_phase" ON "stream_coordination_sessions" USING btree ("current_phase");--> statement-breakpoint
CREATE INDEX "idx_stream_coord_sessions_start_time" ON "stream_coordination_sessions" USING btree ("actual_start_time");--> statement-breakpoint
CREATE INDEX "idx_user_activity_analytics_user_id" ON "user_activity_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_activity_analytics_event_type" ON "user_activity_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_user_activity_analytics_event_category" ON "user_activity_analytics" USING btree ("event_category");--> statement-breakpoint
CREATE INDEX "idx_user_activity_analytics_timestamp" ON "user_activity_analytics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_user_activity_analytics_session_id" ON "user_activity_analytics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_user_appeals_user" ON "user_appeals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_appeals_action" ON "user_appeals" USING btree ("moderation_action_id");--> statement-breakpoint
CREATE INDEX "idx_user_appeals_status" ON "user_appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_appeals_reviewer" ON "user_appeals" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "idx_user_appeals_created" ON "user_appeals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_platform_active" ON "user_platform_accounts" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_user_reputation_user_id" ON "user_reputation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_reputation_score" ON "user_reputation" USING btree ("score");--> statement-breakpoint
CREATE INDEX "idx_user_reputation_level" ON "user_reputation" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role" ON "user_roles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_user_roles_community" ON "user_roles" USING btree ("community_id");