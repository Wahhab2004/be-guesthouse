-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_bookerId_fkey";

-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "bookerAdminId" TEXT,
ALTER COLUMN "bookerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "public"."Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_bookerAdminId_fkey" FOREIGN KEY ("bookerAdminId") REFERENCES "public"."AdminTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
