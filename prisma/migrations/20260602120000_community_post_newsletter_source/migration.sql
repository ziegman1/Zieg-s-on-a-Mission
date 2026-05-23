-- Mission Hub: link feed announcements to external sources (e.g. Newsletter Builder)

ALTER TABLE "community_posts" ADD COLUMN "source_kind" TEXT;
ALTER TABLE "community_posts" ADD COLUMN "source_id" TEXT;
ALTER TABLE "community_posts" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX "community_posts_source_kind_source_id_key"
ON "community_posts"("source_kind", "source_id");

CREATE INDEX "community_posts_source_kind_source_id_idx"
ON "community_posts"("source_kind", "source_id");
