/*
  Warnings:

  - You are about to drop the column `totalPrice` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `finalPrice` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subTotalPrice` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "totalPrice",
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "subTotalPrice" DOUBLE PRECISION NOT NULL;
