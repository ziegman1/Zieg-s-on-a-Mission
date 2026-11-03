-- Additive privacy-conscious analytics (Option B).
-- Preserves all existing PageView rows/columns. New classification columns are nullable
-- so historical rows remain unclassified (treated as unverified in reporting).

-- AlterTable PageView
ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "trafficClass" TEXT;
ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "classSource" TEXT;
ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "classSignals" TEXT;
ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "uaCategory" TEXT;

CREATE INDEX IF NOT EXISTS "PageView_createdAt_trafficClass_idx" ON "PageView"("createdAt", "trafficClass");
CREATE INDEX IF NOT EXISTS "PageView_sessionId_createdAt_idx" ON "PageView"("sessionId", "createdAt");

-- CreateTable analytics_sessions
CREATE TABLE IF NOT EXISTS "analytics_sessions" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traffic_class" TEXT NOT NULL DEFAULT 'unverified',
    "class_source" TEXT,
    "class_signals" TEXT,
    "ua_category" TEXT,
    "engaged" BOOLEAN NOT NULL DEFAULT false,
    "max_scroll_depth" INTEGER NOT NULL DEFAULT 0,
    "active_ms" INTEGER NOT NULL DEFAULT 0,
    "landing_path" TEXT,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_sessions_created_at_idx" ON "analytics_sessions"("created_at");
CREATE INDEX IF NOT EXISTS "analytics_sessions_last_seen_at_idx" ON "analytics_sessions"("last_seen_at");
CREATE INDEX IF NOT EXISTS "analytics_sessions_traffic_class_created_at_idx" ON "analytics_sessions"("traffic_class", "created_at");

-- CreateTable analytics_events
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traffic_class" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events"("created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_created_at_idx" ON "analytics_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_created_at_idx" ON "analytics_events"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_path_created_at_idx" ON "analytics_events"("path", "created_at");

ALTER TABLE "analytics_events"
  DROP CONSTRAINT IF EXISTS "analytics_events_session_id_fkey";
ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
