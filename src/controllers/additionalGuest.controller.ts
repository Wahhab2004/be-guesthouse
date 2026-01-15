import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const createAdditionalGuest = async (req: Request, res: Response) => {
	try {
		const { reservationId, name, passport, dateOfBirth, gender } = req.body;

		// Normalize gender to proper case
		let normalizedGender = gender;
		if (gender) {
			normalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
		}

		// Gender enum validation (optional)
		const allowedGenders = ["Male", "Female"];
		if (gender && !allowedGenders.includes(normalizedGender)) {
			return res.status(400).json({
				status: "error",
				message: `Invalid gender. Please use one of: ${allowedGenders.join(", ")}`,
				data: null,
			});
		}

		// Check if reservation exists
		const reservation = await prisma.reservation.findUnique({
			where: { id: reservationId },
		});

		if (!reservation) {
			return res.status(404).json({
				status: "error",
				message: "Reservation not found",
				data: null,
			});
		}

		// Count existing additional guests
		const totalGuests = await prisma.additionalGuest.count({
			where: { reservationId },
		});

		const maxAdditionalGuests = reservation.guestTotal - 1;
		if (totalGuests >= maxAdditionalGuests) {
			return res.status(400).json({
				status: "error",
				message: `The number of additional guests exceeds the limit. Maximum ${maxAdditionalGuests} additional guests allowed.`,
				data: null,
			});
		}

		// Save additional guest
		const guest = await prisma.additionalGuest.create({
			data: {
				reservationId,
				name,
				passport,
				dateOfBirth,
				gender: normalizedGender,
			},
		});

		return res.status(201).json({
			status: "success",
			message: "Additional guest successfully added",
			data: guest,
		});
	} catch (error) {
		console.error("[createAdditionalGuest]", error);

		return res.status(500).json({
			status: "error",
			message: "An error occurred on the server while adding the guest",
			data: null,
		});
	}
};

export const getGuestsByReservation = async (req: Request, res: Response) => {
	const { reservationId } = req.params;

	try {
		const guests = await prisma.additionalGuest.findMany({
			where: { reservationId },
		});

		res.json(guests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const deleteAdditionalGuest = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		await prisma.additionalGuest.delete({
			where: { id },
		});

		res.json({ message: "Guest deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateAdditionalGuest = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { name, passport, dateOfBirth, gender } = req.body;

	// Normalize gender to proper case
	let normalizedGender = gender;
	if (gender) {
		normalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
	}

	// Gender enum validation (optional)
	const allowedGenders = ["Male", "Female"];
	if (gender && !allowedGenders.includes(normalizedGender)) {
		return res.status(400).json({
			status: "error",
			message: `Invalid gender. Please use one of: ${allowedGenders.join(", ")}`,
			data: null,
		});
	}

	try {
		const guest = await prisma.additionalGuest.update({
			where: { id },
			data: {
				name,
				passport,
				dateOfBirth,
				gender: normalizedGender,
			},
		});

		res.json({ message: "Guest updated successfully", data: guest });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getAllGuestsInReservation = async (
	req: Request,
	res: Response
) => {
	const { reservationId } = req.params;

	try {
		const reservation = await prisma.reservation.findUnique({
			where: { id: reservationId },
			include: {
				guest: true, // main guest
				additionalGuests: true, // related array field in Reservation model
			},
		});

		if (!reservation) {
			return res.status(404).json({
				status: "error",
				message: "Reservation not found",
				data: null,
			});
		}

		const allGuests = [
			{
				isMain: true,
				name: reservation.guest?.name,
				passport: reservation.guest?.passport,
				dateOfBirth: reservation.guest?.dateOfBirth,
				gender: reservation.guest?.gender || null,
			},
			...reservation.additionalGuests.map((g) => ({
				isMain: false,
				name: g.name,
				passport: g.passport,
				dateOfBirth: g.dateOfBirth,
				gender: g.gender,
			})),
		];

		return res.status(200).json({
			status: "success",
			message: "Guest list retrieved successfully",
			data: {
				reservationId: reservation.id,
				guestTotal: reservation.guestTotal,
				guests: allGuests,
			},
		});
	} catch (error) {
		console.error("[getAllGuestsInReservation]", error);

		return res.status(500).json({
			status: "error",
			message: "An error occurred on the server while retrieving the guest list",
			data: null,
		});
	}
};
