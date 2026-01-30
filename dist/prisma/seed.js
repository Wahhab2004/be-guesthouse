"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Buat Guest
        const guest = yield prisma.guest.create({
            data: {
                name: "John Doe",
                username: "johndoe",
                email: "john@example.com",
                phone: "08123456789",
                password: "hashedpassword123", // ganti dengan hasil hash asli
                gender: client_1.Gender.Male,
            },
        });
        // 2. Buat Admin
        const admin = yield prisma.adminTable.create({
            data: {
                name: "Admin One",
                username: "admin",
                email: "admin@example.com",
                password: "adminpass123", // ganti dengan hash
            },
        });
        // 3. Buat Room
        const room = yield prisma.room.create({
            data: {
                name: "Deluxe Room",
                description: "Spacious room with sea view",
                price: 500000,
                photoUrl: "https://example.com/room.jpg",
            },
        });
        // 4. Buat Reservation
        const reservation = yield prisma.reservation.create({
            data: {
                guest: { connect: { id: guest.id } },
                room: { connect: { id: room.id } },
                booker: { connect: { id: guest.id } },
                checkIn: new Date("2025-08-15"),
                checkOut: new Date("2025-08-17"),
                guestTotal: 2,
                adultCount: 1,
                childCount: 1,
                subTotalPrice: 10000,
                discountAmount: 2000,
                finalPrice: 8000,
                status: client_1.ReservationStatus.CONFIRMED,
                additionalGuests: {
                    create: [
                        {
                            name: "Jane Doe",
                            gender: client_1.Gender.Female,
                            priceCategory: client_1.PriceCategory.FULL,
                        },
                    ],
                },
            },
            include: { additionalGuests: true },
        });
        // 5. Buat Payment
        yield prisma.payment.create({
            data: {
                reservationId: reservation.id,
                method: client_1.PaymentMethod.TRANSFER,
                status: client_1.PaymentStatus.PAID,
                amount: 1000000,
                paidAt: new Date(),
            },
        });
        console.log("✅ Dummy data berhasil dibuat!");
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
