"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Ambil setelah "Bearer"
        if (!token) {
            return res.status(401).json({
                code: 401,
                message: "Token tidak ditemukan. Silakan login.",
                status: "gagal",
            });
        }
        try {
            let decoded = null;
            // Coba verifikasi dengan secret admin
            try {
                decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
                decoded.type = "admin";
            }
            catch (err) {
                // Kalau gagal, coba verifikasi dengan secret guest
                try {
                    decoded = jsonwebtoken_1.default.verify(token, process.env.GUEST_SECRET);
                    decoded.type = "guest";
                }
                catch (err2) {
                    return res.status(403).json({
                        code: 403,
                        message: "Token tidak valid.",
                        status: "gagal",
                    });
                }
            }
            // Cek apakah role yang diizinkan cocok
            if (!allowedRoles.includes(decoded.type)) {
                return res.status(403).json({
                    code: 403,
                    message: "Akses ditolak. Role tidak diizinkan.",
                    status: "gagal",
                });
            }
            // Simpan data user ke req.user
            req.user = { id: decoded.id, type: decoded.type };
            next();
        }
        catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(403).json({
                code: 403,
                message: "Token tidak valid atau expired.",
                status: "gagal",
            });
        }
    };
};
exports.authMiddleware = authMiddleware;
