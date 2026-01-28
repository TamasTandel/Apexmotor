-- Add saleStatus column to Car if it does not already exist
-- This is idempotent for PostgreSQL when executed via Prisma migration engine.
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "saleStatus" TEXT NOT NULL DEFAULT 'for_sale';
-- Optional: backfill nulls (in case existing rows had null after previous partial attempts)
UPDATE "Car" SET "saleStatus" = 'for_sale' WHERE "saleStatus" IS NULL;
