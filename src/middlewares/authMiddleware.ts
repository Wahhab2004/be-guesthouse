// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
	user?: {
		id: string;
		type: "admin" | "guest";
	};
}

export const authMiddleware = (allowedRoles: ("admin" | "guest")[]) => {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
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
			let decoded: any = null;

			// Coba verifikasi dengan secret admin
			try {
				decoded = jwt.verify(token, process.env.ADMIN_SECRET as string);
				decoded.type = "admin";
			} catch (err) {
				// Kalau gagal, coba verifikasi dengan secret guest
				try {
					decoded = jwt.verify(token, process.env.GUEST_SECRET as string);
					decoded.type = "guest";
				} catch (err2) {
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
		} catch (error) {
			console.error("Auth Middleware Error:", error);
			return res.status(403).json({
				code: 403,
				message: "Token tidak valid atau expired.",
				status: "gagal",
			});
		}
	};
};
