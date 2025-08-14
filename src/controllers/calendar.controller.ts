import { Request, Response } from "express";
import prisma from "../prisma/client";
import { addMonths, startOfDay } from "date-fns";

export const getAllCalendarInRange = async (req: Request, res: Response) => {
	try {
		// Ambil query parameter
		const { start, end } = req.query;

		// Set default jika tidak ada query
		const today = startOfDay(new Date());
		const startDate = start ? new Date(start as string) : today;
		const endDate = end ? new Date(end as string) : addMonths(today, 6);

		const calendar = await prisma.calendar.findMany({
			where: {
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			include: {
				room: {
					select: {
						name: true,
					},
				},
			},
			orderBy: { date: "asc" },
		});

		return res.status(200).json({
			code: 200,
			data: calendar,
			message: `Data kalender dari ${startDate.toISOString().slice(0, 10)} hingga ${endDate.toISOString().slice(0, 10)}`,
			status: "sukses",
		});
	} catch (error) {
		console.error("Gagal mengambil data kalender:", error);
		return res.status(500).json({
			code: 500,
			message: "Terjadi kesalahan saat mengambil data kalender",
			status: "gagal",
		});
	}
};
