import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";


const prisma = new PrismaClient();


export const getAllRooms = async (_req: Request, res: Response) => {
	try {
		const today = new Date();

		const rooms = await prisma.room.findMany({
			include: {
				reservations: true,
			},
		});

		const roomsWithDynamicStatus = rooms.map((room) => {
			// Cari apakah ada reservasi aktif untuk hari ini
			const isBooked = room.reservations.some((reservation) => {
				return (
					new Date(reservation.checkIn) <= today &&
					new Date(reservation.checkOut) > today
				);
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
	} catch (error) {
		console.error("Error getAllRooms:", error);
		return res.status(500).json({
			code: 500,
			data: [],
			message: "Terjadi kesalahan saat mengambil data kamar",
			status: "gagal",
		});
	}
};


export const getAvailableRooms = async (req: Request, res: Response) => {
	try {
		const { search = "", checkIn, checkOut } = req.query;

		const roomFilters: any = {};

		// 🔍 Filter berdasarkan nama
		if (search) {
			roomFilters.name = {
				contains: search as string,
				mode: "insensitive",
			};
		}

		// 📅 Filter berdasarkan availability di tanggal tertentu
		if (checkIn && checkOut) {
			const parsedCheckIn = new Date(checkIn as string);
			const parsedCheckOut = new Date(checkOut as string);

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

		const rooms = await prisma.room.findMany({
			where: roomFilters,
			include: {
				reservations: true,
			},
		});

		const today = new Date();

		// 💡 Hitung status dinamis
		const roomsWithDynamicStatus = rooms.map((room) => {
			const isBooked = room.reservations.some((reservation) => {
				return (
					new Date(reservation.checkIn) <= today &&
					new Date(reservation.checkOut) > today
				);
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
	} catch (error) {
		console.error("Gagal ambil room:", error);
		return res.status(500).json({
			code: 500,
			message: "Terjadi kesalahan saat mengambil daftar room.",
			status: "gagal",
		});
	}
};


export const getRoomById = async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		const room = await prisma.room.findUnique({ where: { id } });
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
	} catch (error) {
		return res.status(500).json({
			code: 500,
			data: null,
			message: "Terjadi kesalahan saat mengambil detail kamar",
			status: "gagal",
		});
	}
};

export const createRoom = async (req: Request, res: Response) => {
	const { name, description, price, status, photoUrl } = req.body;
	try {
		const newRoom = await prisma.room.create({
			data: { name, description, price: parseFloat(price), status, photoUrl },
		});
		return res.status(201).json({
			code: 201,
			data: newRoom,
			message: "Kamar berhasil ditambahkan",
			status: "sukses",
		});
	} catch (error) {
		return res.status(500).json({
			code: 500,
			data: null,
			message: "Gagal menambahkan kamar",
			status: "gagal",
		});
	}
};

export const updateRoom = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { name, description, price, status, photoUrl } = req.body;

	try {
		const updatedRoom = await prisma.room.update({
			where: { id },
			data: {
				...(name && { name }),
				...(description && { description }),
				...(price !== undefined && { price: parseFloat(price) }),
				...(status && { status }),
				...(photoUrl && { photoUrl }),
			},
		});

		return res.status(200).json({
			code: 200,
			data: updatedRoom,
			message: "Kamar berhasil diperbarui",
			status: "sukses",
		});
	} catch (error) {
		return res.status(500).json({
			code: 500,
			data: null,
			message: "Gagal memperbarui kamar",
			status: "gagal",
		});
	}
};

export const deleteRoom = async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		await prisma.room.delete({ where: { id } });
		return res.status(200).json({
			code: 200,
			data: null,
			message: "Kamar berhasil dihapus",
			status: "sukses",
		});
	} catch (error) {
		return res.status(500).json({
			code: 500,
			data: null,
			message: "Gagal menghapus kamar",
			status: "gagal",
		});
	}
};
