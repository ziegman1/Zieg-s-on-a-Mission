-- Mission Hub partnership / engagement preferences (onboarding segments)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "community_engagement_prefs" JSONB;
