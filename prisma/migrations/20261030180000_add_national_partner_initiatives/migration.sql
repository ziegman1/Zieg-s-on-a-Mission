-- Anonymous national partner training initiatives.
--
-- One row is one completed and commissioned training. Participants are a count.
-- Adds tables and enums only. Does not insert or update existing rows.

CREATE TYPE "MinistryNationalPartnerTrainingType" AS ENUM (
  'JONATHAN_TRAINING',
  'FOUR_FIELDS',
  'MEDICAL_TRAINING'
);

CREATE TYPE "MinistryNationalPartnerInitiativeAuditAction" AS ENUM (
  'CREATED',
  'UPDATED',
  'DELETED'
);

CREATE TABLE "ministry_national_partner_initiatives" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "submission_key" UUID NOT NULL,
  "nation" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "training_type" "MinistryNationalPartnerTrainingType" NOT NULL,
  "completed_count" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ministry_national_partner_initiatives_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ministry_np_initiatives_completed_count_check"
    CHECK ("completed_count" >= 1 AND "completed_count" <= 1000000),
  CONSTRAINT "ministry_np_initiatives_nation_check"
    CHECK (char_length(btrim("nation")) BETWEEN 1 AND 120),
  CONSTRAINT "ministry_np_initiatives_area_check"
    CHECK (char_length(btrim("area")) BETWEEN 1 AND 200)
);

CREATE UNIQUE INDEX "ministry_np_initiatives_submission_key_key"
  ON "ministry_national_partner_initiatives"("submission_key");

CREATE INDEX "ministry_np_initiatives_training_type_idx"
  ON "ministry_national_partner_initiatives"("training_type");

CREATE TABLE "ministry_national_partner_initiative_audits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "initiative_id" UUID NOT NULL,
  "action" "MinistryNationalPartnerInitiativeAuditAction" NOT NULL,
  "nation" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "training_type" "MinistryNationalPartnerTrainingType" NOT NULL,
  "completed_count" INTEGER NOT NULL,
  "previous_nation" TEXT,
  "previous_area" TEXT,
  "previous_training_type" "MinistryNationalPartnerTrainingType",
  "previous_completed_count" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ministry_national_partner_initiative_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ministry_np_initiative_audits_initiative_id_idx"
  ON "ministry_national_partner_initiative_audits"("initiative_id");

ALTER TABLE "ministry_national_partner_initiatives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ministry_national_partner_initiative_audits" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "ministry_national_partner_initiatives" FROM anon, authenticated;
REVOKE ALL ON TABLE "ministry_national_partner_initiative_audits" FROM anon, authenticated;

CREATE POLICY "ministry_np_initiatives_server_manage"
ON "ministry_national_partner_initiatives"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "ministry_np_initiatives_service_role_manage"
ON "ministry_national_partner_initiatives"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "ministry_np_initiative_audits_server_manage"
ON "ministry_national_partner_initiative_audits"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "ministry_np_initiative_audits_service_role_manage"
ON "ministry_national_partner_initiative_audits"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
