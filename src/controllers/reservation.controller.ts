import { Request, Response } from "express";
import prisma from "../prisma/client";
import {
	differenceInDays,
	isBefore,
	addDays,
	differenceInYears,
} from "date-fns";
import jwt from "jsonwebtoken";
import { PriceCategory } from "@prisma/client"; // enum dari Prisma schema

function getDateRange(start: Date, end: Date): Date[] {
	const dates: Date[] = [];
	const current = new Date(start);

	// Ubah kondisi jadi current < end (bukan <=)
	while (current < end) {
		dates.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}

	return dates;
}
// POST /api/reservations - Create a new reservation
export const createReservation = async (req: Request, res: Response) => {
	const {
		guestId,
		roomId,
		checkIn,
		checkOut,
		adultCount,
		childCount = 0, // default 0 kalau tidak ada
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

				const age = differenceInYears(new Date(), dob);
				let priceCategory: PriceCategory = "FULL";
				if (age <= 5) priceCategory = "FREE";
				else if (age <= 10) priceCategory = "HALF";

				if (age <= 10) additionalChildrenCount++;

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
					message:
						"childCount must match the number of children (<= 10 years) in additionalGuests.",
					status: "failed",
				});
			}
		} else {
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
		const room = await prisma.room.findUnique({ where: { id: roomId } });
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
		const token = req.headers.authorization?.split(" ")[1];
		let isAdmin = false;

		if (token) {
			try {
				jwt.verify(token, process.env.ADMIN_SECRET!);
				isAdmin = true;
			} catch {
				try {
					jwt.verify(token, process.env.GUEST_SECRET!);
					isAdmin = false;
				} catch {
					return res.status(401).json({
						code: 401,
						message: "Invalid token",
						status: "failed",
					});
				}
			}
		}

		// Guest hanya boleh booking minimal H-3 sebelum check-in
		if (!isAdmin && isBefore(checkInDate, addDays(now, 3))) {
			return res.status(400).json({
				code: 400,
				message:
					"Guests can only make reservations at least 3 days before check-in.",
				status: "failed",
			});
		}
		checkInDate.setHours(0, 0, 0, 0);
		checkOutDate.setHours(0, 0, 0, 0);

		// Validasi rentang tanggal
		const days = differenceInDays(checkOutDate, checkInDate);
		if (days <= 0) {
			return res.status(400).json({
				code: 400,
				message: "Check-out date must be after check-in date.",
				status: "failed",
			});
		}

		// Cek ketersediaan kamar
		const dates = getDateRange(checkInDate, checkOutDate);
		const existingCalendar = await prisma.calendar.findMany({
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

		// Harga dewasa tanpa diskon
		const totalPriceAdultsRaw = adultCount * room.price * days;

		let totalAdultDiscount = 0;

		// Rule 1: 3–4 hari → ¥500 per hari per dewasa
		if (days >= 3 && days <= 4) {
			totalAdultDiscount = 500 * days * adultCount;
		}

		// Rule 2: >= 5 hari → ¥1000 per hari per dewasa
		if (days >= 5) {
			totalAdultDiscount = 1000 * days * adultCount;
		}

		// Rule 3: 1 hari + 6 dewasa → ¥1000 per dewasa (flat)
		if (days === 1 && adultCount === 6) {
			totalAdultDiscount = 1000 * adultCount;
		}

		// Harga dewasa setelah diskon (tidak boleh minus)
		const totalPriceAdults = Math.max(
			totalPriceAdultsRaw - totalAdultDiscount,
			0,
		);

		// ================= CHILD PRICING =================
		const totalPriceChildren = processedAdditionalGuests.reduce((sum, ag) => {
			if (ag.priceCategory === "FULL") return sum + room.price * days;
			else if (ag.priceCategory === "HALF")
				return sum + room.price * 0.5 * days;
			return sum; // FREE = 0
		}, 0);

		// ================= GRAND TOTAL =================
		const totalPrice = totalPriceAdults + totalPriceChildren;

		let bookerId: string;
		if (token) {
			try {
				const decodedAdmin = jwt.verify(
					token,
					process.env.ADMIN_SECRET!,
				) as any;
				bookerId = decodedAdmin.id;
			} catch {
				const decodedGuest = jwt.verify(
					token,
					process.env.GUEST_SECRET!,
				) as any;
				bookerId = decodedGuest.id;
			}
		}

		// Buat reservasi dan pembayaran, sekaligus buat additionalGuests
		const reservation = await prisma.reservation.create({
			data: {
				...(guestId && { guest: { connect: { id: guestId } } }),
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
				...(isAdmin
					? { bookerAdmin: { connect: { id: bookerId! } } }
					: { booker: { connect: { id: bookerId! } } }),
				room: {
					connect: { id: roomId },
				},
			},
			include: {
				booker: true,
				bookerAdmin: true,
				guest: true,
				room: true,
				payment: true,
				additionalGuests: true,
			},
		});

		// Simpan ke kalender
		await prisma.calendar.createMany({
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
			message:
				"Your reservation has been successfully created and added to our calendar.",
			status: "success",
		});
	} catch (error) {
		console.error("Failed to create reservation:", error);
		return res.status(500).json({
			code: 500,
			message: "Failed to create reservation",
			status: "failed",
		});
	}
};

// GET /api/reservations - Get all reservations with filters
export const getAllReservations = async (req: Request, res: Response) => {
	try {
		const {
			status,
			paymentStatus,
			startDate,
			endDate,
			checkInStart,
			checkInEnd,
			guestName,
			roomName,
			bookerId,
			guestId,
			sortBy,
			sortOrder,
		} = req.query;

		const whereClause: any = {};

		// ================= FILTERS =================
		if (status) {
			whereClause.status = status;
		}

		if (paymentStatus) {
			whereClause.payment = {
				status: paymentStatus,
			};
		}

		if (startDate || endDate) {
			whereClause.createdAt = {};
			if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
			if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
		}

		if (checkInStart || checkInEnd) {
			whereClause.checkIn = {};
			if (checkInStart)
				whereClause.checkIn.gte = new Date(checkInStart as string);
			if (checkInEnd) whereClause.checkIn.lte = new Date(checkInEnd as string);
		}

		if (guestName) {
			whereClause.guest = {
				name: {
					contains: guestName as string,
					mode: "insensitive",
				},
			};
		}

		if (roomName) {
			whereClause.room = {
				name: {
					contains: roomName as string,
					mode: "insensitive",
				},
			};
		}

		if (bookerId) {
			whereClause.bookerId = bookerId;
		}

		if (guestId) {
			whereClause.guestId = guestId;
		}

		// ================= SORTING =================
		let orderBy: any = { createdAt: "desc" };

		if (sortBy && (sortBy === "createdAt" || sortBy === "checkIn")) {
			orderBy = {
				[sortBy]: sortOrder === "asc" ? "asc" : "desc",
			};
		}

		// ================= DATA =================
		const reservations = await prisma.reservation.findMany({
			where: whereClause,
			orderBy,
			include: {
				guest: true,
				room: true,
				payment: true,
				additionalGuests: true,
			},
		});

		// ================= SUMMARY =================
		const totalAll = await prisma.reservation.count();

		const totalFiltered = await prisma.reservation.count({
			where: whereClause,
		});

		// ================= PAID BUT NOT ACTIVE =================
		const paidButNotActive = await prisma.reservation.count({
			where: {
				...whereClause,
				status: "CONFIRMED",
				payment: {
					status: "PAID",
				},
			},
		});

		const statusGroup = await prisma.reservation.groupBy({
			by: ["status"],
			_count: {
				_all: true,
			},
		});

		const paymentGroup = await prisma.payment.groupBy({
			by: ["status"],
			_count: {
				_all: true,
			},
		});

		const byStatus = statusGroup.reduce((acc: any, item) => {
			acc[item.status] = item._count._all;
			return acc;
		}, {});

		const byPayment = paymentGroup.reduce((acc: any, item) => {
			acc[item.status] = item._count._all;
			return acc;
		}, {});

		// ================= RESPONSE =================
		return res.status(200).json({
			code: 200,
			data: reservations,
			summary: {
				totalAll,
				totalFiltered,
				byStatus,
				byPayment,
				paidButNotActive
			},
			message: "Daftar reservasi berhasil diambil",
			status: "sukses",
		});
	} catch (error) {
		console.error("Gagal mengambil reservasi:", error);
		return res.status(500).json({
			code: 500,
			message: "Gagal mengambil reservasi",
			status: "gagal",
		});
	}
};

// GET /api/reservations/:id - Get reservation by ID
export const getReservationById = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		const reservation = await prisma.reservation.findUnique({
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
	} catch (error) {
		console.error("Gagal mengambil detail reservasi:", error);
		return res.status(500).json({
			code: 500,
			message: "Gagal mengambil detail reservasi",
			status: "gagal",
		});
	}
};

// PUT /api/reservations/:id - Update reservation by ID
export const updateReservation = async (req: Request, res: Response) => {
	const { id } = req.params;

	const {
		roomId,
		guestId,
		checkIn,
		checkOut,
		guestTotal,
		status,
		paymentStatus,
		paymentMethod,
		paymentSender,
	} = req.body;

	const proofFile = req.file;
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({
			code: 401,
			message: "Token is required.",
			status: "unauthorized",
		});
	}

	let decoded: any;
	let role: "admin" | "guest" | null = null;

	try {
		try {
			decoded = jwt.verify(token, process.env.ADMIN_SECRET!);
			role = "admin";
		} catch {
			decoded = jwt.verify(token, process.env.GUEST_SECRET!);
			role = "guest";
		}
	} catch {
		return res.status(403).json({
			code: 403,
			message: "Invalid token.",
			status: "forbidden",
		});
	}

	try {
		const existing = await prisma.reservation.findUnique({
			where: { id },
			include: {
				payment: true,
				additionalGuests: true,
			},
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

		const days = differenceInDays(newCheckOut, newCheckIn);
		if (days <= 0) {
			return res.status(400).json({
				code: 400,
				message: "Check-out date must be after check-in date.",
				status: "failed",
			});
		}

		const conflict = await prisma.reservation.findFirst({
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

		const room = await prisma.room.findUnique({
			where: { id: roomId || existing.roomId },
		});

		// Harga dewasa tanpa diskon
		const totalPriceAdultsRaw = existing.adultCount * (room?.price || 0) * days;

		// Siapkan additionalGuests untuk pricing anak
		const processedAdditionalGuests =
			existing.additionalGuests?.map((ag) => ({
				priceCategory: ag.priceCategory!,
			})) || [];

		// ================= ADULT DISCOUNT =================
		let totalAdultDiscount = 0;

		// Rule 1: 3–4 hari → ¥500 per hari per dewasa
		if (days >= 3 && days <= 4) {
			totalAdultDiscount = 500 * days * existing.adultCount;
		}

		// Rule 2: >= 5 hari → ¥1000 per hari per dewasa
		if (days >= 5) {
			totalAdultDiscount = 1000 * days * existing.adultCount;
		}

		// Rule 3: 1 hari + 6 dewasa → ¥1000 per dewasa (flat)
		if (days === 1 && existing.adultCount === 6) {
			totalAdultDiscount = 1000 * existing.adultCount;
		}

		// Harga dewasa setelah diskon
		const totalPriceAdults = Math.max(
			totalPriceAdultsRaw - totalAdultDiscount,
			0,
		);

		// ================= CHILD PRICING =================
		const totalPriceChildren = processedAdditionalGuests.reduce((sum, ag) => {
			if (ag.priceCategory === "FULL") return sum + (room?.price || 0) * days;
			if (ag.priceCategory === "HALF")
				return sum + (room?.price || 0) * 0.5 * days;
			return sum; // FREE
		}, 0);

		// ================= GRAND TOTAL =================
		const totalPrice = totalPriceAdults + totalPriceChildren;

		const photoUrl = req.file;
		const proofUrl = photoUrl ? photoUrl.path : existing.payment?.proofUrl;

		const updated = await prisma.reservation.update({
			where: { id },
			data: {
				...(roomId && { room: { connect: { id: roomId } } }),
				...(guestId && { guest: { connect: { id: guestId } } }),
				checkIn: newCheckIn,
				checkOut: newCheckOut,
				guestTotal: newGuestTotal,
				totalPrice,
				status: status || existing.status,
				payment: {
					update: {
						status: paymentStatus || existing.payment?.status,
						method: paymentMethod || existing.payment?.method,
						sender:
							paymentSender !== undefined
								? paymentSender
								: existing.payment?.sender,
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
	} catch (error) {
		console.error("Failed to update reservation:", error);
		return res.status(500).json({
			code: 500,
			message: "Failed to update reservation.",
			status: "failed",
		});
	}
};

// DELETE /api/reservations/:id - Delete reservation by ID
export const deleteReservation = async (req: Request, res: Response) => {
	const { id } = req.params;
	const token = req.headers.authorization?.split(" ")[1];

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
		jwt.verify(token, process.env.ADMIN_SECRET!);
	} catch (error) {
		return res.status(403).json({
			code: 403,
			message: "Hanya admin yang diizinkan menghapus reservasi",
			status: "gagal",
		});
	}

	try {
		const existing = await prisma.reservation.findUnique({
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

		await prisma.payment.deleteMany({
			where: {
				reservationId: id,
			},
		});
		await prisma.feedback.deleteMany({
			where: {
				reservationId: id,
			},
		});

		await prisma.additionalGuest.deleteMany({
			where: {
				reservationId: id,
			},
		});

		await prisma.calendar.deleteMany({
			where: {
				roomId,
				date: {
					gte: checkIn,
					lt: checkOut,
				},
			},
		});

		await prisma.reservation.delete({ where: { id } });

		return res.status(200).json({
			code: 200,
			message: "Reservasi dan kalender berhasil dihapus",
			status: "sukses",
		});
	} catch (error) {
		console.error("Gagal menghapus reservasi:", error);
		return res.status(500).json({
			code: 500,
			message: "Gagal menghapus reservasi",
			status: "gagal",
		});
	}
};

// DELETE /api/reservations - Delete all reservations
export const deleteAllReservations = async (req: Request, res: Response) => {
	const token = req.headers.authorization?.split(" ")[1];

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
		jwt.verify(token, process.env.ADMIN_SECRET!);
	} catch {
		return res.status(403).json({
			code: 403,
			message: "Hanya admin yang dapat menghapus seluruh reservasi",
			status: "forbidden",
		});
	}

	try {
		// Hapus semua payment terlebih dahulu (jika ada relasi)
		await prisma.payment.deleteMany();

		await prisma.additionalGuest.deleteMany();

		await prisma.calendar.deleteMany();

		// Hapus semua reservasi
		const result = await prisma.reservation.deleteMany();

		return res.status(200).json({
			code: 200,
			message: `${result.count} reservasi berhasil dihapus`,
			status: "sukses",
		});
	} catch (error) {
		console.error("Gagal menghapus seluruh reservasi:", error);
		return res.status(500).json({
			code: 500,
			message: "Gagal menghapus seluruh reservasi",
			status: "gagal",
		});
	}
};
