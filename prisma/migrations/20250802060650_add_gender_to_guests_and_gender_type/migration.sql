/*
  Warnings:

  - The `gender` column on the `AdditionalGuest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('Male', 'Female');

-- AlterTable
ALTER TABLE "public"."AdditionalGuest" DROP COLUMN "gender",
ADD COLUMN     "gender" "public"."Gender";

-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN     "gender" "public"."Gender";
