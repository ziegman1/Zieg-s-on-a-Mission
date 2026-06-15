-- Shared support campaign totals and optional public pledge-intent audit log
CREATE TABLE IF NOT EXISTS "support_campaigns" (
  "id" TEXT NOT NULL,
  "goal_amount" INTEGER NOT NULL,
  "pledged_amount" INTEGER NOT NULL DEFAULT 0,
  "start_date" TIMESTAMPTZ(6) NOT NULL,
  "end_date" TIMESTAMPTZ(6) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_campaign_pledge_intents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "campaign_id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_campaign_pledge_intents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_campaign_pledge_intents_campaign_id_created_at_idx"
  ON "support_campaign_pledge_intents"("campaign_id", "created_at" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_campaign_pledge_intents_campaign_id_fkey'
  ) THEN
    ALTER TABLE "support_campaign_pledge_intents"
      ADD CONSTRAINT "support_campaign_pledge_intents_campaign_id_fkey"
      FOREIGN KEY ("campaign_id") REFERENCES "support_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "support_campaigns" (
  "id",
  "goal_amount",
  "pledged_amount",
  "start_date",
  "end_date",
  "is_active"
) VALUES (
  'support-campaign-2026',
  2000,
  0,
  '2026-06-15T16:50:00-05:00'::timestamptz,
  '2026-06-22T16:50:00-05:00'::timestamptz,
  true
) ON CONFLICT ("id") DO NOTHING;
