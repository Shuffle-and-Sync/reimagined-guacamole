-- Add audit trail fields to user_mfa_settings table
-- Migration for tracking MFA enable/disable lifecycle events

-- Add enabledAt field (nullable timestamp for when MFA was enabled or re-enabled)
ALTER TABLE `user_mfa_settings` ADD COLUMN `enabled_at` integer;--> statement-breakpoint

-- Add disabledAt field (nullable timestamp for when MFA was disabled)
ALTER TABLE `user_mfa_settings` ADD COLUMN `disabled_at` integer;--> statement-breakpoint

-- Backfill enabledAt for currently enabled MFA records using updatedAt as approximation
-- This is a one-time data migration to populate historical data
UPDATE `user_mfa_settings` 
SET `enabled_at` = `updated_at` 
WHERE `enabled` = 1 AND `enabled_at` IS NULL;--> statement-breakpoint
