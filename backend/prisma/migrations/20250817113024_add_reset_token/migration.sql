/*
  Warnings:

  - Added the required column `updatedAt` to the `ServiceBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Car" ADD COLUMN     "category" TEXT,
ADD COLUMN     "lastServiceDate" TIMESTAMP(3),
ADD COLUMN     "odometerKm" INTEGER;

-- AlterTable
ALTER TABLE "public"."ServiceBooking" ADD COLUMN     "amountPaid" DOUBLE PRECISION,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "locationId" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "preferredTime" TEXT,
ADD COLUMN     "serviceType" TEXT,
ADD COLUMN     "slotEnd" TIMESTAMP(3),
ADD COLUMN     "slotStart" TIMESTAMP(3),
ADD COLUMN     "technicianName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExp" TIMESTAMP(3),
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "capacityPerSlot" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "carId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_carId_key" ON "public"."Favorite"("userId", "carId");

-- AddForeignKey
ALTER TABLE "public"."ServiceBooking" ADD CONSTRAINT "ServiceBooking_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_carId_fkey" FOREIGN KEY ("carId") REFERENCES "public"."Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
