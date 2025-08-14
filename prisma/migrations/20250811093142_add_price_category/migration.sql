/*
  Warnings:

  - The `dateOfBirth` column on the `AdditionalGuest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `priceCategory` to the `AdditionalGuest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PriceCategory" AS ENUM ('FREE', 'HALF', 'FULL');

-- AlterTable
ALTER TABLE "public"."AdditionalGuest" ADD COLUMN     "priceCategory" "public"."PriceCategory" NOT NULL,
DROP COLUMN "dateOfBirth",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);
