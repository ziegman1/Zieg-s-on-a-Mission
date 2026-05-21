-- Mission Hub: post comments (visitor_key + display_name until member auth)

CREATE TABLE "community_post_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "parent_comment_id" UUID,
    "visitor_key" TEXT NOT NULL,
    "display_name" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_comments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_parent_comment_id_fkey"
    FOREIGN KEY ("parent_comment_id") REFERENCES "community_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "community_post_comments_post_id_idx" ON "community_post_comments"("post_id");
CREATE INDEX "community_post_comments_parent_comment_id_idx" ON "community_post_comments"("parent_comment_id");
CREATE INDEX "community_post_comments_visitor_key_idx" ON "community_post_comments"("visitor_key");
CREATE INDEX "community_post_comments_status_idx" ON "community_post_comments"("status");
CREATE INDEX "community_post_comments_created_at_idx" ON "community_post_comments"("created_at");

ALTER TABLE "community_post_comments" ENABLE ROW LEVEL SECURITY;

-- Public read: published comments on published posts in published spaces
CREATE POLICY "community_post_comments_select_published"
ON "community_post_comments"
FOR SELECT
TO anon, authenticated
USING (
    status = 'published'
    AND EXISTS (
        SELECT 1 FROM "community_posts" p
        INNER JOIN "community_spaces" s ON s.id = p.space_id
        WHERE p.id = "community_post_comments"."post_id"
          AND p.status = 'published'
          AND s.status = 'published'
    )
);

-- Writes via Next.js server actions + Prisma (postgres role). No direct anon insert/delete.
CREATE POLICY "community_post_comments_server_manage"
ON "community_post_comments"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "community_post_comments_service_role_manage"
ON "community_post_comments"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
