-- AlterTable
ALTER TABLE "public"."Car" ADD COLUMN     "exShowroomPriceINR" INTEGER,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "specs" JSONB;
