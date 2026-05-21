-- Mission Hub: track post creator for per-owner avatars (display name stays "Jeremy & Lindsay" for admins)

ALTER TABLE "community_posts" ADD COLUMN "author_user_id" TEXT;

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_user_id_fkey"
    FOREIGN KEY ("author_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "community_posts_author_user_id_idx" ON "community_posts"("author_user_id");

-- Existing posts were owner-authored; default to Jeremy when that account exists
UPDATE "community_posts"
SET "author_user_id" = (
    SELECT "id" FROM "User"
    WHERE LOWER("email") = 'jziegenhorn@teamexpansion.org'
    ORDER BY "createdAt" ASC
    LIMIT 1
)
WHERE "author_user_id" IS NULL;
