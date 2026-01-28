-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "public"."AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "public"."Notification"("status", "createdAt");
