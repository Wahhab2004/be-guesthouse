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
exports.deleteRoom = exports.updateRoom = exports.createRoom = exports.getRoomById = exports.getAvailableRooms = exports.getAllRooms = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getAllRooms = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        const rooms = yield client_1.default.room.findMany({
            include: {
                reservations: true,
            },
        });
        const roomsWithDynamicStatus = rooms.map((room) => {
            // Cari apakah ada reservasi aktif untuk hari ini
            const isBooked = room.reservations.some((reservation) => {
                return (new Date(reservation.checkIn) <= today &&
                    new Date(reservation.checkOut) > today);
            });
            // Kembalikan data kamar dengan status dinamis
            return {
                id: room.id,
                name: room.name,
                description: room.description,
                price: room.price,
                status: isBooked ? "BOOKED" : "AVAILABLE",
                photoUrl: room.photoUrl,
            };
        });
        return res.status(200).json({
            code: 200,
            data: roomsWithDynamicStatus,
            message: "Data kamar berhasil diambil",
            status: "sukses",
        });
    }
    catch (error) {
        console.error("Error getAllRooms:", error);
        return res.status(500).json({
            code: 500,
            data: [],
            message: "Terjadi kesalahan saat mengambil data kamar",
            status: "gagal",
        });
    }
});
exports.getAllRooms = getAllRooms;
const getAvailableRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search = "", checkIn, checkOut } = req.query;
        const roomFilters = {};
        // 🔍 Filter berdasarkan nama
        if (search) {
            roomFilters.name = {
                contains: search,
                mode: "insensitive",
            };
        }
        // 📅 Filter berdasarkan availability di tanggal tertentu
        if (checkIn && checkOut) {
            const parsedCheckIn = new Date(checkIn);
            const parsedCheckOut = new Date(checkOut);
            roomFilters.reservations = {
                none: {
                    // Ini filter untuk mengecualikan kamar yang *terbentur* dengan tanggal tersebut
                    OR: [
                        {
                            checkIn: {
                                lt: parsedCheckOut,
                            },
                            checkOut: {
                                gt: parsedCheckIn,
                            },
                        },
                    ],
                },
            };
        }
        const rooms = yield client_1.default.room.findMany({
            where: roomFilters,
            include: {
                reservations: true,
            },
        });
        const today = new Date();
        // 💡 Hitung status dinamis
        const roomsWithDynamicStatus = rooms.map((room) => {
            const isBooked = room.reservations.some((reservation) => {
                return (new Date(reservation.checkIn) <= today &&
                    new Date(reservation.checkOut) > today);
            });
            return {
                id: room.id,
                name: room.name,
                description: room.description,
                price: room.price,
                status: isBooked ? "BOOKED" : "AVAILABLE",
                photoUrl: room.photoUrl,
            };
        });
        return res.status(200).json({
            code: 200,
            message: "Daftar room berhasil difilter.",
            status: "sukses",
            data: roomsWithDynamicStatus,
        });
    }
    catch (error) {
        console.error("Gagal ambil room:", error);
        return res.status(500).json({
            code: 500,
            message: "Terjadi kesalahan saat mengambil daftar room.",
            status: "gagal",
        });
    }
});
exports.getAvailableRooms = getAvailableRooms;
const getRoomById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const room = yield client_1.default.room.findUnique({ where: { id } });
        if (!room) {
            return res.status(404).json({
                code: 404,
                data: null,
                message: "Kamar tidak ditemukan",
                status: "gagal",
            });
        }
        return res.status(200).json({
            code: 200,
            data: room,
            message: "Detail kamar berhasil diambil",
            status: "sukses",
        });
    }
    catch (error) {
        return res.status(500).json({
            code: 500,
            data: null,
            message: "Terjadi kesalahan saat mengambil detail kamar",
            status: "gagal",
        });
    }
});
exports.getRoomById = getRoomById;
const ALLOWED_STATUS = ["AVAILABLE", "BOOKED"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const createRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, status } = req.body;
        const photoFile = req.file;
        /* ================= BASIC VALIDATION ================= */
        if (!name || typeof name !== "string" || name.trim().length < 3) {
            return res.status(400).json({
                code: 400,
                message: "Nama kamar wajib diisi (min. 3 karakter)",
                status: "gagal",
            });
        }
        // if (
        // 	!description ||
        // 	typeof description !== "string" ||
        // 	description.trim().length < 10
        // ) {
        // 	return res.status(400).json({
        // 		code: 400,
        // 		message: "Deskripsi wajib diisi (min. 10 karakter)",
        // 		status: "gagal",
        // 	});
        // }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({
                code: 400,
                message: "Harga kamar harus lebih dari 0",
                status: "gagal",
            });
        }
        /* ================= FILE VALIDATION ================= */
        if (photoFile) {
            if (!ALLOWED_MIME.includes(photoFile.mimetype)) {
                return res.status(400).json({
                    code: 400,
                    message: "Format foto harus JPG, PNG, atau WebP",
                    status: "gagal",
                });
            }
            if (photoFile.size > MAX_FILE_SIZE) {
                return res.status(400).json({
                    code: 400,
                    message: "Ukuran foto maksimal 10MB",
                    status: "gagal",
                });
            }
        }
        const photoFile2 = req.file;
        let photoUrlFinal = photoFile2 === null || photoFile2 === void 0 ? void 0 : photoFile2.path;
        const existing = yield client_1.default.room.findFirst({
            where: { name: name.trim() },
        });
        if (existing) {
            return res.status(409).json({
                code: 409,
                message: "Nama kamar sudah digunakan",
                status: "gagal",
            });
        }
        /* ================= CREATE ROOM ================= */
        const newRoom = yield client_1.default.room.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                price: parsedPrice,
                status,
                photoUrl: photoUrlFinal,
            },
        });
        return res.status(201).json({
            code: 201,
            data: newRoom,
            message: "Kamar berhasil ditambahkan",
            status: "sukses",
        });
    }
    catch (error) {
        console.error("Create room error:", error);
        return res.status(500).json({
            code: 500,
            data: null,
            message: "Gagal menambahkan kamar",
            status: "gagal",
        });
    }
});
exports.createRoom = createRoom;
const updateRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, price, status } = req.body;
    const photoFile = req.file;
    const photoUrl = photoFile ? photoFile.path : null;
    // const photoUrlFinal = photoFile ? photoFile.path : photoUrl;
    try {
        const updatedRoom = yield client_1.default.room.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (description && { description })), (price !== undefined && { price: parseFloat(price) })), (status && { status })), (photoUrl && { photoUrl })),
        });
        return res.status(200).json({
            code: 200,
            data: updatedRoom,
            message: "Kamar berhasil diperbarui",
            status: "sukses",
        });
    }
    catch (error) {
        return res.status(500).json({
            code: 500,
            data: null,
            message: "Gagal memperbarui kamar",
            status: "gagal",
        });
    }
});
exports.updateRoom = updateRoom;
const deleteRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield client_1.default.room.delete({ where: { id } });
        return res.status(200).json({
            code: 200,
            data: null,
            message: "Kamar berhasil dihapus",
            status: "sukses",
        });
    }
    catch (error) {
        return res.status(500).json({
            code: 500,
            data: null,
            message: "Gagal menghapus kamar",
            status: "gagal",
        });
    }
});
exports.deleteRoom = deleteRoom;
