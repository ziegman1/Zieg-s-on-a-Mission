-- Mission Hub email suppressions (address-level opt-out; separate from Mail Suite)
CREATE TABLE IF NOT EXISTS "email_suppressions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'mission_hub',
  "reason" TEXT NOT NULL,
  "user_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_suppressions_email_scope_key"
  ON "email_suppressions"("email", "scope");

CREATE INDEX IF NOT EXISTS "email_suppressions_email_idx"
  ON "email_suppressions"("email");

CREATE INDEX IF NOT EXISTS "email_suppressions_scope_idx"
  ON "email_suppressions"("scope");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_suppressions_user_id_fkey'
  ) THEN
    ALTER TABLE "email_suppressions"
      ADD CONSTRAINT "email_suppressions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
