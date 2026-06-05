-- Mission Hub: configurable welcome post path for new-member onboarding redirect
ALTER TABLE "community_hub_settings" ADD COLUMN IF NOT EXISTS "welcome_post_path" TEXT;
