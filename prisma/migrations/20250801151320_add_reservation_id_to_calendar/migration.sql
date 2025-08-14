/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `Calendar` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Calendar" DROP COLUMN "isAvailable",
ADD COLUMN     "reservationId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Calendar" ADD CONSTRAINT "Calendar_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
