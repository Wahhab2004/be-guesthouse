import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
	user?: {
		id: string;
		type: "admin" | "guest";
	};
}

export const createGuest = async (req: AuthRequest, res: Response) => {
	const {
		name,
		email,
		username,
		phone,
		password,
		passport,
		dateOfBirth,
		gender,
		country,
	} = req.body;

	// 🔹 Detect login from token
	let isLoggedIn = false;
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];
		if (token) {
			try {
				jwt.verify(token, process.env.ADMIN_SECRET as string);
				isLoggedIn = true;
			} catch {
				try {
					jwt.verify(token, process.env.GUEST_SECRET as string);
					isLoggedIn = true;
				} catch {
					isLoggedIn = false;
				}
			}
		}
	} catch {
		isLoggedIn = false;
	}

	// === General validation ===
	if (!name || typeof name !== "string" || name.trim().length < 3) {
		return res.status(400).json({
			code: 400,
			message: "Name is required and must be at least 3 characters long.",
			status: "failed",
		});
	}

	if (!email || typeof email !== "string" || !email.includes("@")) {
		return res.status(400).json({
			code: 400,
			message: "Invalid email format.",
			status: "failed",
		});
	}

	if (!username || typeof username !== "string" || username.trim().length < 3) {
		return res.status(400).json({
			code: 400,
			message: "Username is required and must be at least 3 characters long.",
			status: "failed",
		});
	}

	if (!phone || typeof phone !== "string" || phone.length < 8) {
		return res.status(400).json({
			code: 400,
			message: "Invalid phone number.",
			status: "failed",
		});
	}

	// === Password validation only if not logged in ===
	if (!isLoggedIn) {
		if (!password || typeof password !== "string" || password.length < 6) {
			return res.status(400).json({
				code: 400,
				message: "Password must be at least 6 characters (if not logged in).",
				status: "failed",
			});
		}
	}

	const validGenders = ["Male", "Female"];
	if (!gender || !validGenders.includes(gender)) {
		return res.status(400).json({
			code: 400,
			message: "Gender must be 'Male' or 'Female'.",
			status: "failed",
		});
	}

	if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
		return res.status(400).json({
			code: 400,
			message: "Invalid date of birth format.",
			status: "failed",
		});
	}

	if (country && (typeof country !== "string" || country.length < 2)) {
		return res.status(400).json({
			code: 400,
			message: "Country name is too short.",
			status: "failed",
		});
	}

	if (passport && (typeof passport !== "string" || passport.length < 5)) {
		return res.status(400).json({
			code: 400,
			message: "Passport number is too short.",
			status: "failed",
		});
	}

	if (!passport) {
		return res.status(400).json({
			code: 400,
			message: "Passport number is required.",
			status: "failed",
		});
	}

	try {
		// Check if email or username already exists
		const existingGuest = await prisma.guest.findFirst({
			where: { OR: [{ email }, { username }] },
		});

		if (existingGuest) {
			const conflictField =
				existingGuest.email === email ? "Email" : "Username";
			return res.status(409).json({
				code: 409,
				message: `${conflictField} is already in use.`,
				status: "failed",
			});
		}

		// Hash password if not logged in, else set to null
		const hashedPassword =
			!isLoggedIn && password ? await bcrypt.hash(password, 10) : null;

		const guest = await prisma.guest.create({
			data: {
				name,
				email,
				username,
				phone,
				password: hashedPassword,
				passport,
				dateOfBirth,
				gender,
				country,
			},
		});

		return res.status(201).json({
			code: 201,
			message: "Guest created successfully.",
			status: "success",
			data: guest,
		});
	} catch (error) {
		console.error("Failed to create guest:", error);
		return res.status(500).json({
			code: 500,
			message: "An error occurred while creating the guest.",
			status: "failed",
		});
	}
};

// PUT /api/guests/:id - Update guest details
export const updateGuest = async (req: Request, res: Response) => {
	const { id } = req.params;
	const {
		name,
		email,
		username,
		phone,
		password,
		passport,
		dateOfBirth,
		country,
	} = req.body;

	try {
		const guest = await prisma.guest.findUnique({ where: { id } });

		if (!guest) {
			return res.status(404).json({
				code: 404,
				message: "Guest not found.",
				status: "failed",
			});
		}

		// Check if new email is already used
		if (email && email !== guest.email) {
			const existingEmail = await prisma.guest.findUnique({ where: { email } });
			if (existingEmail) {
				return res.status(400).json({
					code: 400,
					message: "Email is already used by another guest.",
					status: "failed",
				});
			}
		}

		// Check if new username is already used
		if (username && username !== guest.username) {
			const existingUsername = await prisma.guest.findUnique({
				where: { username },
			});
			if (existingUsername) {
				return res.status(400).json({
					code: 400,
					message: "Username is already used by another guest.",
					status: "failed",
				});
			}
		}

		// Hash password if updated
		let hashedPassword: string | undefined = undefined;
		if (password) {
			if (password.length < 6) {
				return res.status(400).json({
					code: 400,
					message: "Password must be at least 6 characters long.",
					status: "failed",
				});
			}
			hashedPassword = await bcrypt.hash(password, 10);
		}

		const updatedGuest = await prisma.guest.update({
			where: { id },
			data: {
				name,
				email,
				phone,
				username,
				password: hashedPassword,
				passport,
				dateOfBirth,
				country,
			},
		});

		return res.status(200).json({
			code: 200,
			message: "Guest updated successfully.",
			status: "success",
			data: updatedGuest,
		});
	} catch (error) {
		console.error("Failed to update guest:", error);
		return res.status(500).json({
			code: 500,
			message: "An error occurred while updating the guest.",
			status: "failed",
		});
	}
};

// DELETE /api/guests/:id - Delete a guest
export const deleteGuest = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		const guest = await prisma.guest.findUnique({ where: { id } });

		if (!guest) {
			return res.status(404).json({
				code: 404,
				message: "Guest not found.",
				status: "failed",
			});
		}

		// Check if guest has active reservations
		const reservationCount = await prisma.reservation.count({
			where: { guestId: id },
		});

		if (reservationCount > 0) {
			return res.status(400).json({
				code: 400,
				message: `Guest has ${reservationCount} related reservation(s). Unable to delete.`,
				status: "failed",
			});
		}

		await prisma.guest.delete({ where: { id } });

		return res.status(200).json({
			code: 200,
			message: "Guest deleted successfully.",
			status: "success",
		});
	} catch (error) {
		console.error("Failed to delete guest:", error);
		return res.status(500).json({
			code: 500,
			message: "An error occurred while deleting the guest.",
			status: "failed",
		});
	}
};

// GET /api/guests/:id - Get guest by ID
export const getGuestById = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		const guest = await prisma.guest.findUnique({ where: { id } });

		if (!guest) {
			return res.status(404).json({
				code: 404,
				message: "Guest not found.",
				status: "failed",
			});
		}

		return res.status(200).json({
			code: 200,
			message: "Guest details retrieved successfully.",
			status: "success",
			data: guest,
		});
	} catch (error) {
		console.error("Failed to retrieve guest details:", error);
		return res.status(500).json({
			code: 500,
			message: "An error occurred while retrieving guest details.",
			status: "failed",
		});
	}
};

// GET /api/guests - Get all guests with pagination and search
export const getAllGuests = async (req: Request, res: Response) => {
	const { search, page = "1", limit = "10" } = req.query;

	const pageNumber = parseInt(page as string, 10) || 1;
	const pageSize = parseInt(limit as string, 10) || 10;

	const skip = (pageNumber - 1) * pageSize;

	try {
		const whereClause = search
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

		const [guests, totalGuests] = await Promise.all([
			prisma.guest.findMany({
				where: whereClause,
				skip,
				take: pageSize,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					username: true,
					gender: true,
					passport: true,
					dateOfBirth: true,
					country: true,
					createdAt: true,
				},
			}),
			prisma.guest.count({ where: whereClause }),
		]);

		return res.status(200).json({
			code: 200,
			message: "Guest list retrieved successfully.",
			status: "success",
			data: guests,
			pagination: {
				total: totalGuests,
				page: pageNumber,
				totalPages: Math.ceil(totalGuests / pageSize),
			},
		});
	} catch (error) {
		console.error("Failed to retrieve guest list:", error);
		return res.status(500).json({
			code: 500,
			message: "An error occurred while retrieving the guest list.",
			status: "failed",
		});
	}
};

// DELETE /api/guests - Delete all guests
export const deleteAllGuests = async (req: Request, res: Response) => {
	try {
		// Check if there are guests with active reservations
		const guestsWithReservations = await prisma.guest.findMany({
			where: {
				AND: [
					{ bookedReservations: { some: {} } },
					{ stayedReservations: { some: {} } },
				],
			},
			select: { id: true },
		});

		if (guestsWithReservations.length > 0) {
			return res.status(400).json({
				code: 400,
				message: `${guestsWithReservations.length} guest(s) have related reservations. Unable to delete all guests.`,
				status: "failed",
			});
		}

		// If safe, delete all guests
		const result = await prisma.guest.deleteMany();

		return res.status(200).json({
			code: 200,
			message: `${result.count} guest(s) deleted successfully.`,
			status: "success",
		});
	} catch (error) {
		console.error("Failed to delete all guests:", error);
		return res.status(500).json({
			code: 500,
			message: "An error occurred while deleting all guests.",
			status: "failed",
		});
	}
};
