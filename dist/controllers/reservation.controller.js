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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllReservations = exports.deleteReservation = exports.updateReservation = exports.getReservationById = exports.getAllReservations = exports.createReservation = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const date_fns_1 = require("date-fns");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getDateRange(start, end) {
    const dates = [];
    const current = new Date(start);
    // Ubah kondisi jadi current < end (bukan <=)
    while (current < end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
// POST /api/reservations - Create a new reservation
const createReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { guestId, roomId, checkIn, checkOut, adultCount, childCount = 0, // default 0 kalau tidak ada
    additionalGuests = [], // optional, default array kosong
     } = req.body;
    try {
        // Validasi jumlah tamu dewasa & anak (childCount opsional)
        if (adultCount < 1 || adultCount > 3) {
            return res.status(400).json({
                code: 400,
                message: "Adult guests must be between 1 and 3.",
                status: "failed",
            });
        }
        if (childCount < 0 || childCount > 2) {
            return res.status(400).json({
                code: 400,
                message: "Child guests must be between 0 and 2.",
                status: "failed",
            });
        }
        // Validasi additionalGuests hanya jika ada
        if (additionalGuests && !Array.isArray(additionalGuests)) {
            return res.status(400).json({
                code: 400,
                message: "additionalGuests must be an array.",
                status: "failed",
            });
        }
        const processedAdditionalGuests = [];
        let additionalChildrenCount = 0;
        if (additionalGuests.length > 0) {
            for (const guest of additionalGuests) {
                const { name, passport, dateOfBirth, gender } = guest;
                if (!name || !dateOfBirth) {
                    return res.status(400).json({
                        code: 400,
                        message: "Each additional guest must have a name and dateOfBirth.",
                        status: "failed",
                    });
                }
                const dob = new Date(dateOfBirth);
                if (isNaN(dob.getTime())) {
                    return res.status(400).json({
                        code: 400,
                        message: "Invalid dateOfBirth for an additional guest.",
                        status: "failed",
                    });
                }
                const age = (0, date_fns_1.differenceInYears)(new Date(), dob);
                let priceCategory = "FULL";
                if (age <= 5)
                    priceCategory = "FREE";
                else if (age <= 10)
                    priceCategory = "HALF";
                if (age <= 10)
                    additionalChildrenCount++;
                processedAdditionalGuests.push({
                    name,
                    passport: passport || null,
                    dateOfBirth: dob.toISOString().split("T")[0],
                    gender: gender || null,
                    priceCategory,
                });
            }
            // Validasi childCount hanya jika ada additionalGuests
            if (childCount !== additionalChildrenCount) {
                return res.status(400).json({
                    code: 400,
                    message: "childCount must match the number of children (<= 10 years) in additionalGuests.",
                    status: "failed",
                });
            }
        }
        else {
            // Jika additionalGuests kosong, childCount harus 0
            if (childCount !== 0) {
                return res.status(400).json({
                    code: 400,
                    message: "childCount must be 0 if no additionalGuests provided.",
                    status: "failed",
                });
            }
        }
        // Hitung total tamu (dewasa + anak)
        const totalGuest = adultCount + childCount;
        // Ambil data kamar
        const room = yield client_1.default.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return res.status(404).json({
                code: 404,
                message: "Room not found",
                status: "failed",
            });
        }
        const now = new Date();
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        // Validasi token (admin / guest)
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        let isAdmin = false;
        if (token) {
            try {
                jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
                isAdmin = true;
            }
            catch (_b) {
                try {
                    jsonwebtoken_1.default.verify(token, process.env.GUEST_SECRET);
                    isAdmin = false;
                }
                catch (_c) {
                    return res.status(401).json({
                        code: 401,
                        message: "Invalid token",
                        status: "failed",
                    });
                }
            }
        }
        // Guest hanya boleh booking minimal H-3 sebelum check-in
        if (!isAdmin && (0, date_fns_1.isBefore)(checkInDate, (0, date_fns_1.addDays)(now, 3))) {
            return res.status(400).json({
                code: 400,
                message: "Guests can only make reservations at least 3 days before check-in.",
                status: "failed",
            });
        }
        checkInDate.setHours(0, 0, 0, 0);
        checkOutDate.setHours(0, 0, 0, 0);
        // Validasi rentang tanggal
        const days = (0, date_fns_1.differenceInDays)(checkOutDate, checkInDate);
        if (days <= 0) {
            return res.status(400).json({
                code: 400,
                message: "Check-out date must be after check-in date.",
                status: "failed",
            });
        }
        // Cek ketersediaan kamar
        const dates = getDateRange(checkInDate, checkOutDate);
        const existingCalendar = yield client_1.default.calendar.findMany({
            where: {
                roomId,
                date: { in: dates },
            },
        });
        if (existingCalendar.length > 0) {
            return res.status(400).json({
                code: 400,
                message: "Some of the selected dates are already booked for this room.",
                status: "failed",
            });
        }
        // Hitung total harga
        const totalPriceAdults = adultCount * room.price * days;
        const totalPriceChildren = processedAdditionalGuests.reduce((sum, ag) => {
            if (ag.priceCategory === "FULL")
                return sum + room.price * days;
            else if (ag.priceCategory === "HALF")
                return sum + room.price * 0.5 * days;
            return sum; // FREE = 0
        }, 0);
        const totalPrice = totalPriceAdults + totalPriceChildren;
        let bookerId;
        if (token) {
            try {
                const decodedAdmin = jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
                bookerId = decodedAdmin.id;
            }
            catch (_d) {
                const decodedGuest = jsonwebtoken_1.default.verify(token, process.env.GUEST_SECRET);
                bookerId = decodedGuest.id;
            }
        }
        // Buat reservasi dan pembayaran, sekaligus buat additionalGuests
        const reservation = yield client_1.default.reservation.create({
            data: {
                guestId,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                totalPrice,
                guestTotal: totalGuest,
                adultCount,
                childCount,
                additionalGuests: {
                    create: processedAdditionalGuests,
                },
                payment: {
                    create: {
                        method: "E_WALLET",
                        status: "UNPAID",
                        amount: totalPrice,
                    },
                },
                booker: {
                    connect: { id: bookerId }, // pastikan bookerId ada
                },
                room: {
                    connect: { id: roomId },
                },
            },
            include: {
                guest: true,
                room: true,
                payment: true,
                additionalGuests: true,
            },
        });
        // Simpan ke kalender
        yield client_1.default.calendar.createMany({
            data: dates.map((date) => ({
                roomId,
                date,
                reservationId: reservation.id,
            })),
            skipDuplicates: true,
        });
        return res.status(201).json({
            code: 201,
            data: reservation,
            message: "Your reservation has been successfully created and added to our calendar.",
            status: "success",
        });
    }
    catch (error) {
        console.error("Failed to create reservation:", error);
        return res.status(500).json({
            code: 500,
            message: "Failed to create reservation",
            status: "failed",
        });
    }
});
exports.createReservation = createReservation;
// GET /api/reservations - Get all reservations with filters
const getAllReservations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, paymentStatus, startDate, endDate, checkInStart, checkInEnd, guestName, roomName, bookerId, // ✅ tambah ini
        sortBy, sortOrder, } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (paymentStatus) {
            whereClause.Payment = {
                status: paymentStatus,
            };
        }
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate)
                whereClause.createdAt.gte = new Date(startDate);
            if (endDate)
                whereClause.createdAt.lte = new Date(endDate);
        }
        if (checkInStart || checkInEnd) {
            whereClause.checkIn = {};
            if (checkInStart)
                whereClause.checkIn.gte = new Date(checkInStart);
            if (checkInEnd)
                whereClause.checkIn.lte = new Date(checkInEnd);
        }
        if (guestName) {
            whereClause.guest = {
                name: {
                    contains: guestName,
                    mode: "insensitive",
                },
            };
        }
        if (roomName) {
            whereClause.room = {
                name: {
                    contains: roomName,
                    mode: "insensitive",
                },
            };
        }
        // ✅ Filter berdasarkan bookerId
        if (bookerId) {
            whereClause.bookerId = bookerId;
        }
        let orderBy = { createdAt: "desc" };
        if (sortBy && (sortBy === "createdAt" || sortBy === "checkIn")) {
            orderBy = {
                [sortBy]: sortOrder === "asc" ? "asc" : "desc",
            };
        }
        const reservations = yield client_1.default.reservation.findMany({
            where: whereClause,
            orderBy,
            include: {
                guest: true,
                room: true,
                payment: true,
                additionalGuests: true,
            },
        });
        return res.status(200).json({
            code: 200,
            data: reservations,
            message: "Daftar reservasi berhasil diambil",
            status: "sukses",
        });
    }
    catch (error) {
        console.error("Gagal mengambil reservasi:", error);
        return res.status(500).json({
            code: 500,
            message: "Gagal mengambil reservasi",
            status: "gagal",
        });
    }
});
exports.getAllReservations = getAllReservations;
// GET /api/reservations/:id - Get reservation by ID
const getReservationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const reservation = yield client_1.default.reservation.findUnique({
            where: { id },
            include: {
                guest: true,
                room: true,
                payment: true,
                additionalGuests: true,
            },
        });
        if (!reservation) {
            return res.status(404).json({
                code: 404,
                message: "Reservasi tidak ditemukan",
                status: "gagal",
            });
        }
        return res.status(200).json({
            code: 200,
            data: reservation,
            message: "Detail reservasi berhasil diambil",
            status: "sukses",
        });
    }
    catch (error) {
        console.error("Gagal mengambil detail reservasi:", error);
        return res.status(500).json({
            code: 500,
            message: "Gagal mengambil detail reservasi",
            status: "gagal",
        });
    }
});
exports.getReservationById = getReservationById;
// PUT /api/reservations/:id - Update reservation by ID
const updateReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { id } = req.params;
    const { roomId, guestId, checkIn, checkOut, guestTotal, status, paymentStatus, paymentMethod, paymentSender, } = req.body;
    const proofFile = req.file;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            code: 401,
            message: "Token is required.",
            status: "unauthorized",
        });
    }
    let decoded;
    let role = null;
    try {
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
            role = "admin";
        }
        catch (_f) {
            decoded = jsonwebtoken_1.default.verify(token, process.env.GUEST_SECRET);
            role = "guest";
        }
    }
    catch (_g) {
        return res.status(403).json({
            code: 403,
            message: "Invalid token.",
            status: "forbidden",
        });
    }
    try {
        const existing = yield client_1.default.reservation.findUnique({
            where: { id },
            include: { payment: true },
        });
        if (!existing) {
            return res.status(404).json({
                code: 404,
                message: "Reservation not found.",
                status: "failed",
            });
        }
        if (role === "guest" && existing.bookerId !== decoded.id) {
            return res.status(403).json({
                code: 403,
                message: "You do not have permission to modify this reservation.",
                status: "forbidden",
            });
        }
        const newCheckIn = checkIn ? new Date(checkIn) : existing.checkIn;
        const newCheckOut = checkOut ? new Date(checkOut) : existing.checkOut;
        const newGuestTotal = guestTotal
            ? parseInt(guestTotal, 10)
            : existing.guestTotal;
        const days = (0, date_fns_1.differenceInDays)(newCheckOut, newCheckIn);
        if (days <= 0) {
            return res.status(400).json({
                code: 400,
                message: "Check-out date must be after check-in date.",
                status: "failed",
            });
        }
        const conflict = yield client_1.default.reservation.findFirst({
            where: {
                roomId: roomId || existing.roomId,
                id: { not: id },
                OR: [
                    { checkIn: { lte: newCheckOut, gte: newCheckIn } },
                    { checkOut: { lte: newCheckOut, gte: newCheckIn } },
                    {
                        AND: [
                            { checkIn: { lte: newCheckIn } },
                            { checkOut: { gte: newCheckOut } },
                        ],
                    },
                ],
            },
        });
        if (conflict) {
            return res.status(400).json({
                code: 400,
                message: "Selected dates conflict with another reservation.",
                status: "failed",
            });
        }
        const room = yield client_1.default.room.findUnique({
            where: { id: roomId || existing.roomId },
        });
        const totalPrice = days * ((room === null || room === void 0 ? void 0 : room.price) || 0) * newGuestTotal;
        let proofUrl = (_b = existing.payment) === null || _b === void 0 ? void 0 : _b.proofUrl;
        if (proofFile) {
            proofUrl = `/uploads/${proofFile.filename}`;
        }
        const updated = yield client_1.default.reservation.update({
            where: { id },
            data: {
                roomId: roomId || existing.roomId,
                guestId: guestId || existing.guestId,
                checkIn: newCheckIn,
                checkOut: newCheckOut,
                guestTotal: newGuestTotal,
                totalPrice,
                status: status || existing.status,
                payment: {
                    update: {
                        status: paymentStatus || ((_c = existing.payment) === null || _c === void 0 ? void 0 : _c.status),
                        method: paymentMethod || ((_d = existing.payment) === null || _d === void 0 ? void 0 : _d.method),
                        sender: paymentSender !== undefined
                            ? paymentSender
                            : (_e = existing.payment) === null || _e === void 0 ? void 0 : _e.sender,
                        proofUrl,
                    },
                },
            },
            include: { payment: true },
        });
        return res.status(200).json({
            code: 200,
            data: updated,
            message: "Reservation updated successfully.",
            status: "success",
        });
    }
    catch (error) {
        console.error("Failed to update reservation:", error);
        return res.status(500).json({
            code: 500,
            message: "Failed to update reservation.",
            status: "failed",
        });
    }
});
exports.updateReservation = updateReservation;
// DELETE /api/reservations/:id - Delete reservation by ID
const deleteReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    // Validasi token
    if (!token) {
        return res.status(401).json({
            code: 401,
            message: "Token tidak ditemukan",
            status: "gagal",
        });
    }
    // Verifikasi token harus sebagai admin
    try {
        jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
    }
    catch (error) {
        return res.status(403).json({
            code: 403,
            message: "Hanya admin yang diizinkan menghapus reservasi",
            status: "gagal",
        });
    }
    try {
        const existing = yield client_1.default.reservation.findUnique({
            where: { id },
            select: { checkIn: true, checkOut: true, roomId: true },
        });
        if (!existing) {
            return res.status(404).json({
                code: 404,
                message: "Reservasi tidak ditemukan",
                status: "gagal",
            });
        }
        const { checkIn, checkOut, roomId } = existing;
        yield client_1.default.payment.deleteMany({
            where: {
                reservationId: id,
            },
        });
        yield client_1.default.feedback.deleteMany({
            where: {
                reservationId: id,
            },
        });
        yield client_1.default.additionalGuest.deleteMany({
            where: {
                reservationId: id,
            },
        });
        yield client_1.default.calendar.deleteMany({
            where: {
                roomId,
                date: {
                    gte: checkIn,
                    lt: checkOut,
                },
            },
        });
        yield client_1.default.reservation.delete({ where: { id } });
        return res.status(200).json({
            code: 200,
            message: "Reservasi dan kalender berhasil dihapus",
            status: "sukses",
        });
    }
    catch (error) {
        console.error("Gagal menghapus reservasi:", error);
        return res.status(500).json({
            code: 500,
            message: "Gagal menghapus reservasi",
            status: "gagal",
        });
    }
});
exports.deleteReservation = deleteReservation;
// DELETE /api/reservations - Delete all reservations
const deleteAllReservations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    // Cek token
    if (!token) {
        return res.status(401).json({
            code: 401,
            message: "Token dibutuhkan",
            status: "unauthorized",
        });
    }
    try {
        // Verifikasi sebagai admin
        jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
    }
    catch (_b) {
        return res.status(403).json({
            code: 403,
            message: "Hanya admin yang dapat menghapus seluruh reservasi",
            status: "forbidden",
        });
    }
    try {
        // Hapus semua payment terlebih dahulu (jika ada relasi)
        yield client_1.default.payment.deleteMany();
        yield client_1.default.additionalGuest.deleteMany();
        yield client_1.default.calendar.deleteMany();
        // Hapus semua reservasi
        const result = yield client_1.default.reservation.deleteMany();
        return res.status(200).json({
            code: 200,
            message: `${result.count} reservasi berhasil dihapus`,
            status: "sukses",
        });
    }
    catch (error) {
        console.error("Gagal menghapus seluruh reservasi:", error);
        return res.status(500).json({
            code: 500,
            message: "Gagal menghapus seluruh reservasi",
            status: "gagal",
        });
    }
});
exports.deleteAllReservations = deleteAllReservations;
