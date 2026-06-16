-- CreateTable
CREATE TABLE "community_hub_activity_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_type" TEXT NOT NULL,
    "member_id" UUID,
    "user_id" TEXT,
    "visitor_key" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_hub_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_hub_activity_events_created_at_idx" ON "community_hub_activity_events"("created_at");

-- CreateIndex
CREATE INDEX "community_hub_activity_events_member_id_created_at_idx" ON "community_hub_activity_events"("member_id", "created_at");

-- CreateIndex
CREATE INDEX "community_hub_activity_events_visitor_key_created_at_idx" ON "community_hub_activity_events"("visitor_key", "created_at");

-- CreateIndex
CREATE INDEX "community_hub_activity_events_event_type_created_at_idx" ON "community_hub_activity_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "community_hub_activity_events_path_created_at_idx" ON "community_hub_activity_events"("path", "created_at");

-- AddForeignKey
ALTER TABLE "community_hub_activity_events" ADD CONSTRAINT "community_hub_activity_events_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "community_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_hub_activity_events" ADD CONSTRAINT "community_hub_activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
