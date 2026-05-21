-- Mission Hub: community_spaces (Supabase-compatible, RLS for public read of published rows)

CREATE TABLE "community_spaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_spaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_spaces_slug_key" ON "community_spaces"("slug");
CREATE INDEX "community_spaces_status_sort_order_idx" ON "community_spaces"("status", "sort_order");

ALTER TABLE "community_spaces" ENABLE ROW LEVEL SECURITY;

-- Storefront / Supabase anon: published spaces only
CREATE POLICY "community_spaces_select_published"
ON "community_spaces"
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Prisma / server connection (Supabase pooler user is often postgres.PROJECT_REF)
CREATE POLICY "community_spaces_server_manage"
ON "community_spaces"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

-- Supabase service role (API with service key; also bypasses RLS in clients)
CREATE POLICY "community_spaces_service_role_manage"
ON "community_spaces"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
