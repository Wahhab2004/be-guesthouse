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
exports.loginAdmin = exports.loginGuest = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = __importDefault(require("../prisma/client"));
// Helper: Generate JWT
const generateToken = (payload, type) => {
    const secret = type === "admin" ? process.env.ADMIN_SECRET : process.env.GUEST_SECRET;
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
};
// Login Guest
const loginGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "Username dan password wajib diisi." });
    }
    try {
        const guest = yield client_1.default.guest.findUnique({ where: { username } });
        if (!guest) {
            return res.status(404).json({ message: "Akun guest tidak ditemukan." });
        }
        const isValid = yield bcrypt_1.default.compare(password, guest.password);
        if (!isValid) {
            return res.status(401).json({ message: "Password salah." });
        }
        const token = generateToken({ id: guest.id, type: "guest" }, "guest");
        return res.status(200).json({
            message: "Login berhasil.",
            token,
            user: {
                id: guest.id,
                username: guest.username,
                name: guest.name,
                email: guest.email,
                phone: guest.phone,
            },
        });
    }
    catch (error) {
        console.error("Login Guest Error:", error);
        return res.status(500).json({ message: "Terjadi kesalahan di server." });
    }
});
exports.loginGuest = loginGuest;
// Login Admin
const loginAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "Username dan password wajib diisi." });
    }
    try {
        const admin = yield client_1.default.adminTable.findUnique({ where: { username } });
        if (!admin) {
            return res.status(404).json({ message: "Akun admin tidak ditemukan." });
        }
        const isValid = yield bcrypt_1.default.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ message: "Password salah." });
        }
        const token = generateToken({ id: admin.id, type: "admin" }, "admin");
        return res.status(200).json({
            message: "Login berhasil.",
            token,
            user: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                email: admin.email,
            },
        });
    }
    catch (error) {
        console.error("Login Admin Error:", error);
        return res.status(500).json({ message: "Terjadi kesalahan di server." });
    }
});
exports.loginAdmin = loginAdmin;
