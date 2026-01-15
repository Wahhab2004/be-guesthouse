import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import prisma from "../prisma/client";

// Helper: Generate JWT
const generateToken = (payload: object, type: "admin" | "guest") => {
	const secret =
		type === "admin" ? process.env.ADMIN_SECRET : process.env.GUEST_SECRET;
	return jwt.sign(payload, secret as string, { expiresIn: "7d" });
};

// Login Guest
export const loginGuest = async (req: Request, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ message: "Username dan password wajib diisi." });
	}

	try {
		const guest = await prisma.guest.findUnique({ where: { username } });

		if (!guest) {
			return res.status(404).json({ message: "Akun guest tidak ditemukan." });
		}

		const isValid = await bcrypt.compare(password, guest.password as string);
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
	} catch (error) {
		console.error("Login Guest Error:", error);
		return res.status(500).json({ message: "Terjadi kesalahan di server." });
	}
};

// Login Admin
export const loginAdmin = async (req: Request, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ message: "Username dan password wajib diisi." });
	}

	try {
		const admin = await prisma.adminTable.findUnique({ where: { username } });

		if (!admin) {
			return res.status(404).json({ message: "Akun admin tidak ditemukan." });
		}

		const isValid = await bcrypt.compare(password, admin.password);
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
	} catch (error) {
		console.error("Login Admin Error:", error);
		return res.status(500).json({ message: "Terjadi kesalahan di server." });
	}
};
