-- Add address and bookingCode columns
ALTER TABLE "ServiceBooking" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "ServiceBooking" ADD COLUMN IF NOT EXISTS "bookingCode" TEXT;
-- Ensure uniqueness (may fail if duplicates exist; clean duplicates beforehand if needed)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ServiceBooking_bookingCode_key') THEN
    CREATE UNIQUE INDEX "ServiceBooking_bookingCode_key" ON "ServiceBooking"("bookingCode");
  END IF;
END $$;
