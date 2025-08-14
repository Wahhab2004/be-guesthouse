import { Request, Response } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcrypt";

export const createAdmin = async (req: Request, res: Response) => {
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
		const existingEmail = await prisma.adminTable.findUnique({
			where: { email },
		});
		if (existingEmail) {
			return res.status(409).json({
				code: 409,
				status: "gagal",
				message: "Email sudah terdaftar",
			});
		}

		const existingUsername = await prisma.adminTable.findUnique({
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
		const hashedPassword = await bcrypt.hash(password, 10);

		// Simpan admin baru
		const admin = await prisma.adminTable.create({
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
	} catch (error) {
		console.error("Gagal membuat admin:", error);
		return res.status(500).json({
			code: 500,
			status: "gagal",
			message: "Terjadi kesalahan pada server saat membuat admin",
		});
	}
};

export const getAllAdmins = async (req: Request, res: Response) => {
	try {
		// Ambil parameter pencarian dan pagination
		const search = (req.query.search as string)?.toLowerCase() || "";
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const skip = (page - 1) * limit;

		// Filter condition jika search tersedia
		const whereCondition = search
			? {
					OR: [
						{
							username: {
								contains: search as string,
								mode: "insensitive" as const,
							},
						},
						{
							email: {
								contains: search as string,
								mode: "insensitive" as const,
							},
						},
					],
			  }
			: {};

		// Hitung total hasil pencarian
		const totalAdmins = await prisma.adminTable.count({
			where: whereCondition,
		});

		// Ambil data admin
		const admins = await prisma.adminTable.findMany({
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
	} catch (error) {
		console.error("Gagal mengambil data admin:", error);
		return res.status(500).json({
			code: 500,
			status: "gagal",
			message: "Terjadi kesalahan saat mengambil data admin",
		});
	}
};

export const updateAdmin = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { name, email, password, username } = req.body;

	try {
		// Cek apakah admin ditemukan
		const existing = await prisma.adminTable.findUnique({ where: { id } });
		if (!existing) {
			return res.status(404).json({
				code: 404,
				status: "gagal",
				message: "Admin tidak ditemukan",
			});
		}

		// Siapkan data update
		const updateData: any = {};
		if (name) updateData.name = name;
		if (email) updateData.email = email;
		if (password) updateData.password = await bcrypt.hash(password, 10);
		if (username) updateData.username = username;

		// Lakukan update
		const updated = await prisma.adminTable.update({
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
	} catch (error) {
		console.error("Gagal memperbarui admin:", error);
		return res.status(500).json({
			code: 500,
			status: "gagal",
			message: "Terjadi kesalahan saat memperbarui admin",
		});
	}
};

export const deleteAdmin = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		// Cek apakah admin ada
		const existing = await prisma.adminTable.findUnique({ where: { id } });
		if (!existing) {
			return res.status(404).json({
				code: 404,
				status: "gagal",
				message: "Admin tidak ditemukan",
			});
		}

		// Hapus admin
		await prisma.adminTable.delete({ where: { id } });

		return res.status(200).json({
			code: 200,
			status: "sukses",
			message: `Admin dengan ID ${id} berhasil dihapus`,
		});
	} catch (error) {
		console.error("Gagal menghapus admin:", error);
		return res.status(500).json({
			code: 500,
			status: "gagal",
			message: "Terjadi kesalahan saat menghapus admin",
		});
	}
};
