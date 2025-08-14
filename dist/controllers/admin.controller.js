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
exports.deleteAdmin = exports.updateAdmin = exports.getAllAdmins = exports.createAdmin = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, email, password } = req.body;
    // Validasi input
    if (!name || !username || !email || !password) {
        return res.status(400).json({
            code: 400,
            status: "gagal",
            message: "Semua field wajib diisi: name, username, email, password",
        });
    }
    // Validasi email format sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            code: 400,
            status: "gagal",
            message: "Format email tidak valid",
        });
    }
    // Validasi password strength (minimal 6 karakter)
    if (password.length < 6) {
        return res.status(400).json({
            code: 400,
            status: "gagal",
            message: "Password minimal 6 karakter",
        });
    }
    try {
        // Cek jika email atau username sudah terdaftar
        const existingEmail = yield client_1.default.adminTable.findUnique({
            where: { email },
        });
        if (existingEmail) {
            return res.status(409).json({
                code: 409,
                status: "gagal",
                message: "Email sudah terdaftar",
            });
        }
        const existingUsername = yield client_1.default.adminTable.findUnique({
            where: { username },
        });
        if (existingUsername) {
            return res.status(409).json({
                code: 409,
                status: "gagal",
                message: "Username sudah digunakan",
            });
        }
        // Hash password sebelum disimpan
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Simpan admin baru
        const admin = yield client_1.default.adminTable.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
            },
        });
        return res.status(201).json({
            code: 201,
            status: "sukses",
            message: "Admin berhasil dibuat",
            data: {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                createdAt: admin.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Gagal membuat admin:", error);
        return res.status(500).json({
            code: 500,
            status: "gagal",
            message: "Terjadi kesalahan pada server saat membuat admin",
        });
    }
});
exports.createAdmin = createAdmin;
const getAllAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ambil parameter pencarian dan pagination
        const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filter condition jika search tersedia
        const whereCondition = search
            ? {
                OR: [
                    {
                        username: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {};
        // Hitung total hasil pencarian
        const totalAdmins = yield client_1.default.adminTable.count({
            where: whereCondition,
        });
        // Ambil data admin
        const admins = yield client_1.default.adminTable.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.status(200).json({
            code: 200,
            status: "sukses",
            message: "Data admin berhasil diambil",
            data: admins,
            meta: {
                totalData: totalAdmins,
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(totalAdmins / limit),
            },
        });
    }
    catch (error) {
        console.error("Gagal mengambil data admin:", error);
        return res.status(500).json({
            code: 500,
            status: "gagal",
            message: "Terjadi kesalahan saat mengambil data admin",
        });
    }
});
exports.getAllAdmins = getAllAdmins;
const updateAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, email, password, username } = req.body;
    try {
        // Cek apakah admin ditemukan
        const existing = yield client_1.default.adminTable.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                code: 404,
                status: "gagal",
                message: "Admin tidak ditemukan",
            });
        }
        // Siapkan data update
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (password)
            updateData.password = yield bcrypt_1.default.hash(password, 10);
        if (username)
            updateData.username = username;
        // Lakukan update
        const updated = yield client_1.default.adminTable.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.status(200).json({
            code: 200,
            status: "sukses",
            message: "Admin berhasil diperbarui",
            data: updated,
        });
    }
    catch (error) {
        console.error("Gagal memperbarui admin:", error);
        return res.status(500).json({
            code: 500,
            status: "gagal",
            message: "Terjadi kesalahan saat memperbarui admin",
        });
    }
});
exports.updateAdmin = updateAdmin;
const deleteAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Cek apakah admin ada
        const existing = yield client_1.default.adminTable.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                code: 404,
                status: "gagal",
                message: "Admin tidak ditemukan",
            });
        }
        // Hapus admin
        yield client_1.default.adminTable.delete({ where: { id } });
        return res.status(200).json({
            code: 200,
            status: "sukses",
            message: `Admin dengan ID ${id} berhasil dihapus`,
        });
    }
    catch (error) {
        console.error("Gagal menghapus admin:", error);
        return res.status(500).json({
            code: 500,
            status: "gagal",
            message: "Terjadi kesalahan saat menghapus admin",
        });
    }
});
exports.deleteAdmin = deleteAdmin;
