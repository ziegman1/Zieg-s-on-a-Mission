-- Launch is an activity program. Choosing it does not change a person's pathway
-- or their Mobilized, Trained & Equipped, or Sent values.
--
-- Adds one enum label. Does not update ministry_activities, ministry_people,
-- recruits, or ministry_legacy_links.

ALTER TYPE "MinistryActivityType" ADD VALUE 'LAUNCH' BEFORE 'OTHER';
