/*
  Warnings:

  - Added the required column `adultCount` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `childCount` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "adultCount" INTEGER NOT NULL,
ADD COLUMN     "childCount" INTEGER NOT NULL;
