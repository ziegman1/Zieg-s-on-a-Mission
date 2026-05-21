-- Mission Hub: intentional space environments (welcome, engagement, interaction)

ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "space_type" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "welcome_message" TEXT;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "engagement_prompt" TEXT;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "theme_mood" TEXT;

ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "allow_comments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "allow_reactions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "allow_member_posts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "require_post_approval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "allow_voice_messages" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "show_welcome_message" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "pin_welcome_message" BOOLEAN NOT NULL DEFAULT true;

-- Migrate legacy JSON settings into columns where present
UPDATE "community_spaces"
SET
    "allow_comments" = COALESCE(("settings"->>'allowComments')::boolean, "allow_comments"),
    "allow_reactions" = COALESCE(("settings"->>'allowReactions')::boolean, "allow_reactions"),
    "allow_member_posts" = COALESCE(("settings"->>'allowMemberPosting')::boolean, "allow_member_posts"),
    "require_post_approval" = COALESCE(("settings"->>'requirePostApproval')::boolean, "require_post_approval")
WHERE "settings" IS NOT NULL AND "settings"::text <> '{}';

-- Prayer & Praise Room: welcome copy and engagement prompt
UPDATE "community_spaces"
SET
    "space_type" = 'prayer_room',
    "theme_mood" = 'prayerful',
    "welcome_message" = $welcome$
Welcome to the Prayer & Praise Room

This is a sacred space within Mission Hub where we invite you to truly join us in prayer for our family, our ministry, and the people God is calling us to reach among the nations.

Here you will find prayer requests, ministry updates, stories from the journey, and moments where we are trusting God to move in ways only He can. But this space is not meant to be a place of passive observation. It is an invitation into active participation.

We encourage you not only to respond with reactions, but to genuinely engage with us through prayer, encouragement, written responses, testimonies, and even voice messages as we seek the Lord together.

And as prayers are answered, may this room also become filled with praise to the God of wonders who continues to show His faithfulness again and again.

Thank you for standing with us, praying with us, and becoming part of the story God is writing.
$welcome$,
    "engagement_prompt" = 'How can we pray with you today?',
    "show_welcome_message" = true,
    "pin_welcome_message" = true,
    "allow_comments" = true,
    "allow_reactions" = true
WHERE
    LOWER("slug") IN ('prayer-room', 'prayer-praise-room', 'prayer-and-praise-room')
    OR LOWER("title") LIKE '%prayer%praise%'
    OR LOWER("title") = 'prayer & praise room';
