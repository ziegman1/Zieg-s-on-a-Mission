-- Mission Hub: community_posts (RLS — published posts in published spaces only)

CREATE TABLE "community_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "space_id" UUID NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "post_type" TEXT NOT NULL DEFAULT 'update',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "cover_image_url" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_space_id_fkey"
    FOREIGN KEY ("space_id") REFERENCES "community_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "community_posts_space_id_status_idx" ON "community_posts"("space_id", "status");
CREATE INDEX "community_posts_status_published_at_idx" ON "community_posts"("status", "published_at");

ALTER TABLE "community_posts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select_published"
ON "community_posts"
FOR SELECT
TO anon, authenticated
USING (
    status = 'published'
    AND EXISTS (
        SELECT 1 FROM "community_spaces" s
        WHERE s.id = "community_posts"."space_id" AND s.status = 'published'
    )
);

CREATE POLICY "community_posts_server_manage"
ON "community_posts"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "community_posts_service_role_manage"
ON "community_posts"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
