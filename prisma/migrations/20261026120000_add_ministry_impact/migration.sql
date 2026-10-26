-- Ministry Impact Tracker foundation. Additive only.
--
-- Creates ministry_people and ministry_activities. Does not alter recruits, does not insert
-- or update any row, and does not assign milestones to existing recruit records.
--
-- Mobilized, Trained & Equipped, and Sent are independent booleans. The optional dates are
-- not the condition for counting. A confirmed Sent person must have a designation.
--
-- Row Level Security matches the other individual-record tables: enabled, with manage
-- policies for the postgres app role and service_role only. anon and authenticated receive
-- no privileges and no policies.

CREATE TYPE "MinistryPathway" AS ENUM (
  'TEAM_EXPANSION_RECRUIT',
  'NATIONAL_PARTNER',
  'TRAINING_PARTICIPANT'
);

CREATE TYPE "MinistrySentDesignation" AS ENUM (
  'OVERSEAS_MISSIONARY',
  'INTERNATIONAL_SERVICES',
  'D_COURSE',
  'NATIONAL_WORKER',
  'OTHER_DISCIPLE_MAKER'
);

CREATE TYPE "MinistryActivityType" AS ENUM (
  'JONATHAN_TRAINING',
  'MEDICAL_TRAINING',
  'SUPPORT_RAISING_COACHING',
  'D_COURSE',
  'ZUME',
  'FOUR_FIELDS_ONLINE',
  'FIDELIS',
  'OTHER'
);

CREATE TYPE "MinistryActivityStatus" AS ENUM (
  'PARTICIPATED',
  'COMPLETED'
);

CREATE TABLE "ministry_people" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "display_name" TEXT NOT NULL,
  "pathway" "MinistryPathway",
  "legacy_recruit_id" UUID,
  "household_id" UUID,
  "mobilized" BOOLEAN NOT NULL DEFAULT false,
  "mobilized_on" DATE,
  "trained_equipped" BOOLEAN NOT NULL DEFAULT false,
  "trained_equipped_on" DATE,
  "sent" BOOLEAN NOT NULL DEFAULT false,
  "sent_on" DATE,
  "sent_designation" "MinistrySentDesignation",
  "sent_verified_at" TIMESTAMPTZ(6),
  "sent_verified_by" TEXT,
  "sent_verification_note" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ministry_people_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ministry_people_sent_designation_check" CHECK (
    ("sent" = true AND "sent_designation" IS NOT NULL)
    OR ("sent" = false AND "sent_designation" IS NULL)
  )
);

CREATE INDEX "ministry_people_legacy_recruit_id_idx" ON "ministry_people"("legacy_recruit_id");
CREATE INDEX "ministry_people_household_id_idx" ON "ministry_people"("household_id");
CREATE INDEX "ministry_people_sent_idx" ON "ministry_people"("sent");

ALTER TABLE "ministry_people"
  ADD CONSTRAINT "ministry_people_legacy_recruit_id_fkey"
  FOREIGN KEY ("legacy_recruit_id") REFERENCES "recruits"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ministry_activities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "person_id" UUID NOT NULL,
  "activity_type" "MinistryActivityType" NOT NULL,
  "status" "MinistryActivityStatus" NOT NULL,
  "activity_on" DATE,
  "location" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ministry_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ministry_activities_person_id_activity_type_idx"
  ON "ministry_activities"("person_id", "activity_type");

ALTER TABLE "ministry_activities"
  ADD CONSTRAINT "ministry_activities_person_id_fkey"
  FOREIGN KEY ("person_id") REFERENCES "ministry_people"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ministry_people" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ministry_activities" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "ministry_people" FROM anon, authenticated;
REVOKE ALL ON TABLE "ministry_activities" FROM anon, authenticated;

CREATE POLICY "ministry_people_server_manage"
ON "ministry_people"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "ministry_people_service_role_manage"
ON "ministry_people"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "ministry_activities_server_manage"
ON "ministry_activities"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "ministry_activities_service_role_manage"
ON "ministry_activities"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
