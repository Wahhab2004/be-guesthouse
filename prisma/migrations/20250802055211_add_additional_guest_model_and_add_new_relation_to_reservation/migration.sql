-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'CASH';

-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'HALF_PAID';

-- CreateTable
CREATE TABLE "public"."AdditionalGuest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passport" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,

    CONSTRAINT "AdditionalGuest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AdditionalGuest" ADD CONSTRAINT "AdditionalGuest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
