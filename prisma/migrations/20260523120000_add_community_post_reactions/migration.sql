-- Mission Hub: post reactions (anonymous visitor_key until member auth exists)

CREATE TABLE "community_post_reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "visitor_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_reactions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "community_post_reactions_post_id_visitor_key_reaction_type_key"
    ON "community_post_reactions"("post_id", "visitor_key", "reaction_type");

CREATE INDEX "community_post_reactions_post_id_idx" ON "community_post_reactions"("post_id");
CREATE INDEX "community_post_reactions_reaction_type_idx" ON "community_post_reactions"("reaction_type");
CREATE INDEX "community_post_reactions_visitor_key_idx" ON "community_post_reactions"("visitor_key");

ALTER TABLE "community_post_reactions" ENABLE ROW LEVEL SECURITY;

-- Read reactions only for published posts in published spaces (counts / feed)
CREATE POLICY "community_post_reactions_select_published"
ON "community_post_reactions"
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM "community_posts" p
        INNER JOIN "community_spaces" s ON s.id = p.space_id
        WHERE p.id = "community_post_reactions"."post_id"
          AND p.status = 'published'
          AND s.status = 'published'
    )
);

-- Writes go through Next.js server actions + Prisma (postgres role).
-- Direct anon INSERT/DELETE are not exposed; server validates visitor_key from httpOnly cookie.
CREATE POLICY "community_post_reactions_server_manage"
ON "community_post_reactions"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "community_post_reactions_service_role_manage"
ON "community_post_reactions"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
