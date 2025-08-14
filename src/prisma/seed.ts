import { PrismaClient, Gender, PriceCategory, ReservationStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Buat Guest
  const guest = await prisma.guest.create({
    data: {
      name: "John Doe",
      username: "johndoe",
      email: "john@example.com",
      phone: "08123456789",
      password: "hashedpassword123", // ganti dengan hasil hash asli
      gender: Gender.Male,
    },
  });

  // 2. Buat Admin
  const admin = await prisma.adminTable.create({
    data: {
      name: "Admin One",
      username: "admin",
      email: "admin@example.com",
      password: "adminpass123", // ganti dengan hash
    },
  });

  // 3. Buat Room
  const room = await prisma.room.create({
    data: {
      name: "Deluxe Room",
      description: "Spacious room with sea view",
      price: 500000,
      photoUrl: "https://example.com/room.jpg",
    },
  });

  // 4. Buat Reservation
  const reservation = await prisma.reservation.create({
    data: {
      guestId: guest.id,
      roomId: room.id,
      checkIn: new Date("2025-08-15"),
      checkOut: new Date("2025-08-17"),
      guestTotal: 2,
      totalPrice: 1000000,
      status: ReservationStatus.CONFIRMED,
      additionalGuests: {
        create: [
          {
            name: "Jane Doe",
            gender: Gender.Female,
            priceCategory: PriceCategory.FULL,
          },
        ],
      },
    },
    include: { additionalGuests: true },
  });

  // 5. Buat Payment
  await prisma.payment.create({
    data: {
      reservationId: reservation.id,
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.PAID,
      amount: 1000000,
      paidAt: new Date(),
    },
  });

  console.log("✅ Dummy data berhasil dibuat!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
