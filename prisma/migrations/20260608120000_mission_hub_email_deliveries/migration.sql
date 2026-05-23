-- Mission Hub notification email delivery log (Resend). Extensible to posts, digest, invites.

CREATE TABLE "mission_hub_email_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipient_user_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "notification_kind" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resend_message_id" TEXT,
    "error_message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),

    CONSTRAINT "mission_hub_email_deliveries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "mission_hub_email_deliveries" ADD CONSTRAINT "mission_hub_email_deliveries_recipient_user_id_fkey"
    FOREIGN KEY ("recipient_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "mission_hub_email_deliveries_recipient_dedupe_key"
    ON "mission_hub_email_deliveries"("recipient_user_id", "dedupe_key");

CREATE INDEX "mission_hub_email_deliveries_dedupe_key_idx"
    ON "mission_hub_email_deliveries"("dedupe_key");

CREATE INDEX "mission_hub_email_deliveries_status_created_idx"
    ON "mission_hub_email_deliveries"("status", "created_at" DESC);

ALTER TABLE "mission_hub_email_deliveries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_hub_email_deliveries_server_manage"
ON "mission_hub_email_deliveries"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "mission_hub_email_deliveries_service_role_manage"
ON "mission_hub_email_deliveries"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
