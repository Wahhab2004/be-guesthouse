/*
  Warnings:

  - You are about to drop the `Authentication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Authentication" DROP CONSTRAINT "Authentication_guestId_fkey";

-- DropTable
DROP TABLE "public"."Authentication";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "public"."AuthenticationGuest" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "AuthenticationGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthenticationAdmin" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "AuthenticationAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationGuest_guestId_key" ON "public"."AuthenticationGuest"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationGuest_username_key" ON "public"."AuthenticationGuest"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationAdmin_adminId_key" ON "public"."AuthenticationAdmin"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationAdmin_username_key" ON "public"."AuthenticationAdmin"("username");

-- AddForeignKey
ALTER TABLE "public"."AuthenticationGuest" ADD CONSTRAINT "AuthenticationGuest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuthenticationAdmin" ADD CONSTRAINT "AuthenticationAdmin_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."AdminTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
