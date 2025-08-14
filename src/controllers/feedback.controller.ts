// controllers/feedbackController.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";

// Create feedback for a reservation
export const createFeedback = async (req: Request, res: Response) => {
	const { reservationId, rating, comment } = req.body;

	// Validasi rating
	if (!rating || rating < 1 || rating > 5) {
		return res.status(400).json({
			code: 400,
			message: "Rating wajib antara 1 sampai 5",
			status: "gagal",
		});
	}

	try {
		// Cek apakah reservation ada
		const reservation = await prisma.reservation.findUnique({
			where: { id: reservationId },
		});
		if (!reservation) {
			return res.status(404).json({
				code: 404,
				message: "Reservasi tidak ditemukan",
				status: "gagal",
			});
		}

		// Cek apakah sudah ada feedback untuk reservation ini
		const existing = await prisma.feedback.findUnique({
			where: { reservationId },
		});
		if (existing) {
			return res.status(400).json({
				code: 400,
				message: "Feedback untuk reservasi ini sudah diberikan",
				status: "gagal",
			});
		}

		// Simpan feedback
		const feedback = await prisma.feedback.create({
			data: {
				reservationId,
				rating,
				comment,
			},
		});

		return res.status(201).json({
			code: 201,
			message: "Feedback berhasil dikirim",
			data: feedback,
			status: "sukses",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			code: 500,
			message: "Terjadi kesalahan saat mengirim feedback",
			status: "gagal",
		});
	}
};

// Get feedback by reservation ID
export const getFeedbackByReservation = async (req: Request, res: Response) => {
	const { reservationId } = req.params;

	try {
		const feedback = await prisma.feedback.findUnique({
			where: { reservationId },
		});

		if (!feedback) {
			return res.status(404).json({
				code: 404,
				message: "Feedback tidak ditemukan untuk reservasi ini",
				status: "gagal",
			});
		}

		return res.status(200).json({
			code: 200,
			message: "Feedback ditemukan",
			data: feedback,
			status: "sukses",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			code: 500,
			message: "Terjadi kesalahan saat mengambil feedback",
			status: "gagal",
		});
	}
};

// Get all feedbacks
export const getAllFeedbacks = async (_req: Request, res: Response) => {
	try {
		const feedbacks = await prisma.feedback.findMany({
			include: {
				reservation: {
					select: {
						id: true,
						guest: {
							select: { name: true },
						},
						room: {
							select: { name: true },
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return res.status(200).json({
			code: 200,
			data: feedbacks,
			status: "sukses",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			code: 500,
			message: "Gagal mengambil data feedback",
			status: "gagal",
		});
	}
};

// Update feedback
export const updateFeedback = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { rating, comment } = req.body;

	try {
		const updated = await prisma.feedback.update({
			where: { id },
			data: {
				rating: rating !== undefined ? Number(rating) : undefined,
				comment,
			},
		});

		return res.status(200).json({
			code: 200,
			message: "Feedback berhasil diperbarui",
			data: updated,
			status: "sukses",
		});
	} catch (error) {
		return res.status(500).json({
			code: 500,
			message: "Gagal memperbarui feedback",
			status: "gagal",
		});
	}
};

// Delete feedback
export const deleteFeedback = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		await prisma.feedback.delete({
			where: { id },
		});

		return res.status(200).json({
			code: 200,
			message: "Feedback berhasil dihapus",
			status: "sukses",
		});
	} catch (error) {
		return res.status(500).json({
			code: 500,
			message: "Gagal menghapus feedback",
			status: "gagal",
		});
	}
};
