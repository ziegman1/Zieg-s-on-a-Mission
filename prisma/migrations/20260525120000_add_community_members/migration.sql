-- Mission Hub: lightweight member profiles for commenters

CREATE TABLE "community_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "profile_image_url" TEXT,
    "visitor_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_members_email_key" ON "community_members"("email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX "community_members_visitor_key_key" ON "community_members"("visitor_key") WHERE "visitor_key" IS NOT NULL;
CREATE INDEX "community_members_status_idx" ON "community_members"("status");
CREATE INDEX "community_members_created_at_idx" ON "community_members"("created_at");

ALTER TABLE "community_post_comments" ADD COLUMN "member_id" UUID;

ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "community_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "community_post_comments_member_id_idx" ON "community_post_comments"("member_id");

ALTER TABLE "community_members" ENABLE ROW LEVEL SECURITY;

-- Public read: active members only (for comment display names/avatars on published comments)
CREATE POLICY "community_members_select_active_for_comments"
ON "community_members"
FOR SELECT
TO anon, authenticated
USING (
    status = 'active'
    AND EXISTS (
        SELECT 1 FROM "community_post_comments" c
        INNER JOIN "community_posts" p ON p.id = c.post_id
        INNER JOIN "community_spaces" s ON s.id = p.space_id
        WHERE c.member_id = "community_members"."id"
          AND c.status = 'published'
          AND p.status = 'published'
          AND s.status = 'published'
    )
);

-- Writes via Next.js + Prisma (postgres role)
CREATE POLICY "community_members_server_manage"
ON "community_members"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "community_members_service_role_manage"
ON "community_members"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
