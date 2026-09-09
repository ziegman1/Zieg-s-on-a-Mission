-- Recruit tracker behind the "300 Missionaries Mobilized, Trained & Sent by August 31, 2031" goal.
-- Additive only: no existing table is altered.
--
-- Mobilized / Trained / Sent are derived in application code and are intentionally not stored:
--   Mobilized = every row
--   Trained   = jonathan_training_complete
--   Sent      = jonathan_training_complete AND fully_funded
CREATE TABLE IF NOT EXISTS "recruits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "jonathan_training_complete" BOOLEAN NOT NULL DEFAULT false,
  "fully_funded" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recruits_pkey" PRIMARY KEY ("id")
);

-- Serves both the Trained count and the Sent count via its leftmost prefix.
CREATE INDEX IF NOT EXISTS "recruits_milestones_idx"
  ON "recruits"("jonathan_training_complete", "fully_funded");
