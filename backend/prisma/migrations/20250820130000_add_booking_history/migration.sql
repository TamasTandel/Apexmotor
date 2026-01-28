-- Add new columns to ServiceBooking
ALTER TABLE "ServiceBooking"
  ADD COLUMN IF NOT EXISTS "finalCost" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "dropOffAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "pickUpAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "billNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;

-- Create history table
CREATE TABLE IF NOT EXISTS "ServiceBookingHistory" (
  "id" SERIAL PRIMARY KEY,
  "bookingId" INTEGER NOT NULL REFERENCES "ServiceBooking"("id") ON DELETE CASCADE,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "actorId" INTEGER,
  "note" TEXT,
  "changedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ServiceBookingHistory_bookingId_changedAt_idx" ON "ServiceBookingHistory"("bookingId", "changedAt");
