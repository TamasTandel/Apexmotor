-- Ensure userId FK constraint exists linking ServiceBooking -> User
DO $$
BEGIN
  ALTER TABLE "ServiceBooking"
    ADD CONSTRAINT "ServiceBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  -- constraint already exists
END $$;
