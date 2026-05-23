-- Allow one Mission Hub announcement per newsletter per space (ministry-updates + newsletters).

DROP INDEX IF EXISTS "community_posts_source_kind_source_id_key";

CREATE UNIQUE INDEX "community_posts_source_kind_source_id_space_id_key"
ON "community_posts"("source_kind", "source_id", "space_id");
