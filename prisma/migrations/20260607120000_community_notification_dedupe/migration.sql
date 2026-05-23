-- Dedupe keys and metadata for newsletter publish (and future) in-app notifications.

ALTER TABLE "community_notifications" ADD COLUMN IF NOT EXISTS "dedupe_key" TEXT;
ALTER TABLE "community_notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS "community_notifications_recipient_dedupe_key"
ON "community_notifications"("recipient_user_id", "dedupe_key")
WHERE "dedupe_key" IS NOT NULL;
