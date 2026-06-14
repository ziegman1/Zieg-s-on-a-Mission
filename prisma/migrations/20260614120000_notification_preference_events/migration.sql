-- Mission Hub notification preference / suppression audit log
CREATE TABLE IF NOT EXISTS "notification_preference_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "member_id" UUID,
  "email" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "previous_prefs" JSONB,
  "next_prefs" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preference_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_preference_events_user_id_created_at_idx"
  ON "notification_preference_events"("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "notification_preference_events_event_type_created_at_idx"
  ON "notification_preference_events"("event_type", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "notification_preference_events_created_at_idx"
  ON "notification_preference_events"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "notification_preference_events_email_idx"
  ON "notification_preference_events"("email");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_preference_events_user_id_fkey'
  ) THEN
    ALTER TABLE "notification_preference_events"
      ADD CONSTRAINT "notification_preference_events_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_preference_events_member_id_fkey'
  ) THEN
    ALTER TABLE "notification_preference_events"
      ADD CONSTRAINT "notification_preference_events_member_id_fkey"
      FOREIGN KEY ("member_id") REFERENCES "community_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
