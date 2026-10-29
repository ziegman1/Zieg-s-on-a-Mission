-- Legacy reconciliation links. Additive only.
--
-- Creates ministry_legacy_links. Does not alter recruits, ministry_people, or
-- ministry_activities, and does not insert, update, or delete any existing row.
--
-- A legacy checkbox stored here is historical evidence. It does not confirm
-- Mobilized, Trained & Equipped, or Sent.
--
-- Recovery, if this migration must be undone before any imported person is trusted:
--   DROP TABLE public.ministry_legacy_links;
--   DROP TYPE "MinistryLegacyReviewStatus";
-- That drop does not remove ministry_people rows. Those rows, if an import has
-- already run, stay until a separate reviewed cleanup.

CREATE TYPE "MinistryLegacyReviewStatus" AS ENUM (
  'PENDING_REVIEW',
  'CONFIRMED',
  'NEEDS_CLARIFICATION'
);

CREATE TABLE "ministry_legacy_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "legacy_recruit_id" UUID NOT NULL,
  "individual_key" TEXT NOT NULL,
  "original_display_name" TEXT NOT NULL,
  "original_jonathan_training" BOOLEAN NOT NULL,
  "original_fully_funded" BOOLEAN NOT NULL,
  "person_id" UUID NOT NULL,
  "review_status" "MinistryLegacyReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewed_at" TIMESTAMPTZ(6),
  "reviewed_by" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "evidence" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ministry_legacy_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ministry_legacy_links_person_id_key"
  ON "ministry_legacy_links"("person_id");

CREATE UNIQUE INDEX "ministry_legacy_links_recruit_individual_key"
  ON "ministry_legacy_links"("legacy_recruit_id", "individual_key");

CREATE INDEX "ministry_legacy_links_review_status_idx"
  ON "ministry_legacy_links"("review_status");

ALTER TABLE "ministry_legacy_links"
  ADD CONSTRAINT "ministry_legacy_links_legacy_recruit_id_fkey"
  FOREIGN KEY ("legacy_recruit_id") REFERENCES "recruits"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ministry_legacy_links"
  ADD CONSTRAINT "ministry_legacy_links_person_id_fkey"
  FOREIGN KEY ("person_id") REFERENCES "ministry_people"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ministry_legacy_links" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "ministry_legacy_links" FROM anon, authenticated;

CREATE POLICY "ministry_legacy_links_server_manage"
ON "ministry_legacy_links"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "ministry_legacy_links_service_role_manage"
ON "ministry_legacy_links"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
