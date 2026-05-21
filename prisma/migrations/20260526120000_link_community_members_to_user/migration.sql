-- Link Mission Hub member profiles to User accounts (Auth.js credentials)

ALTER TABLE "community_members" ADD COLUMN "user_id" TEXT;

CREATE UNIQUE INDEX "community_members_user_id_key" ON "community_members"("user_id") WHERE "user_id" IS NOT NULL;

ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "community_members_user_id_idx" ON "community_members"("user_id");
