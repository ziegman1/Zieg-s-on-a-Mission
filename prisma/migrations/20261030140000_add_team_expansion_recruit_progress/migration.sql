-- Team Expansion Recruit progression inputs.
--
-- Existing ministry_people rows receive false / empty defaults only.
-- This does not copy recruits.jonathan_training_complete or recruits.fully_funded,
-- does not read legacy reconciliation evidence, and does not change mobilized,
-- trained_equipped, sent, or sent_designation.

ALTER TABLE "ministry_people"
  ADD COLUMN "jonathan_training_complete" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "fully_funded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "milestone_audit" TEXT NOT NULL DEFAULT '';
