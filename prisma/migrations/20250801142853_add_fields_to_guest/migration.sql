/*
  Warnings:

  - Added the required column `password` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TEXT,
ADD COLUMN     "passport" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;
