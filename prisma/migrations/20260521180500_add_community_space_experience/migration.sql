/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `community_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `community_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[visitor_key]` on the table `community_members` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "community_notifications_created_at_idx";

-- AlterTable
ALTER TABLE "SiteCopy" ALTER COLUMN "id" SET DEFAULT 'default';

-- CreateIndex
CREATE UNIQUE INDEX "community_members_user_id_key" ON "community_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_email_key" ON "community_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_visitor_key_key" ON "community_members"("visitor_key");

-- CreateIndex
CREATE INDEX "community_notifications_created_at_idx" ON "community_notifications"("created_at");

-- CreateIndex
CREATE INDEX "community_spaces_space_type_idx" ON "community_spaces"("space_type");

-- RenameIndex
ALTER INDEX "community_notifications_recipient_read_at_idx" RENAME TO "community_notifications_recipient_user_id_read_at_idx";
