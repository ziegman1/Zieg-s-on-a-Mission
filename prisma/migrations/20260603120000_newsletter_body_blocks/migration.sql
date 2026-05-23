-- Newsletter block-based composer content (JSON array)

ALTER TABLE "newsletters" ADD COLUMN "body_blocks" JSONB NOT NULL DEFAULT '[]';
