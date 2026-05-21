-- Mission Hub: in-app activity notifications (no push/email yet)

CREATE TABLE "community_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipient_user_id" TEXT,
    "actor_user_id" TEXT,
    "actor_member_id" UUID,
    "post_id" UUID,
    "comment_id" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_recipient_user_id_fkey"
    FOREIGN KEY ("recipient_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_actor_member_id_fkey"
    FOREIGN KEY ("actor_member_id") REFERENCES "community_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_comment_id_fkey"
    FOREIGN KEY ("comment_id") REFERENCES "community_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "community_notifications_recipient_user_id_idx" ON "community_notifications"("recipient_user_id");
CREATE INDEX "community_notifications_recipient_read_at_idx" ON "community_notifications"("recipient_user_id", "read_at");
CREATE INDEX "community_notifications_created_at_idx" ON "community_notifications"("created_at" DESC);

-- Avoid duplicate notifications for the same comment + type per recipient
CREATE UNIQUE INDEX "community_notifications_recipient_comment_type_key"
    ON "community_notifications"("recipient_user_id", "comment_id", "type")
    WHERE "comment_id" IS NOT NULL;

ALTER TABLE "community_notifications" ENABLE ROW LEVEL SECURITY;

-- No public/anon access; app reads via Prisma (postgres role)
CREATE POLICY "community_notifications_server_manage"
ON "community_notifications"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "community_notifications_service_role_manage"
ON "community_notifications"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
