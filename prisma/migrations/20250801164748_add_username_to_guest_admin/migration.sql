/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `AdminTable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Guest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `AdminTable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AdminTable" ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Guest" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AdminTable_username_key" ON "public"."AdminTable"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_username_key" ON "public"."Guest"("username");
