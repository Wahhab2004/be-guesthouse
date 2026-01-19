"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllGuests = exports.getAllGuests = exports.getGuestById = exports.deleteGuest = exports.updateGuest = exports.createGuest = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = __importDefault(require("../prisma/client"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// POST /api/guests - Create a new guest
const createGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, username, // username bisa opsional
    phone, password, passport, dateOfBirth, gender, country, } = req.body;
    // Normalize gender to proper case
    let normalizedGender = gender;
    if (gender) {
        normalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }
    // 🔹 Detect login from token
    let isLoggedIn = false;
    let isAdmin = false;
    let guestId = null;
    // Validasi login dengan token
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                jsonwebtoken_1.default.verify(token, process.env.ADMIN_SECRET);
                isLoggedIn = true;
                isAdmin = true; // Jika token admin, set isAdmin true
            }
            catch (_a) {
                // Jika bukan admin, cek token guest
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.GUEST_SECRET);
                    isLoggedIn = true;
                    guestId = decoded.id; // Menyimpan id guest
                }
                catch (_b) {
                    isLoggedIn = false;
                }
            }
        }
    }
    catch (_c) {
        isLoggedIn = false;
    }
    // === Validasi Umum ===
    if (!name || typeof name !== "string" || name.trim().length < 3) {
        return res.status(400).json({
            code: 400,
            message: "Name is required and must be at least 3 characters long.",
            status: "failed",
        });
    }
    // Jika username tidak ada, maka generate username dari name
    let generatedUsername = username
        ? username
        : name.trim().toLowerCase().replace(/\s+/g, "");
    // Validasi email hanya jika bukan admin
    if (!isAdmin &&
        (!email || typeof email !== "string" || !email.includes("@"))) {
        return res.status(400).json({
            code: 400,
            message: "Invalid email format.",
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
    // === Password validation only if not logged in and not admin ===
    if (!isLoggedIn && !isAdmin) {
        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                code: 400,
                message: "Password must be at least 6 characters (if not logged in).",
                status: "failed",
            });
        }
    }
    const validGenders = ["Male", "Female"];
    if (!gender || !validGenders.includes(normalizedGender)) {
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
    // Check if email or username already exists
    try {
        const existingGuest = yield client_1.default.guest.findFirst({
            where: { OR: [{ email }, { username: generatedUsername }] },
        });
        if (existingGuest) {
            const conflictField = existingGuest.email === email ? "Email" : "Username";
            return res.status(409).json({
                code: 409,
                message: `${conflictField} is already in use.`,
                status: "failed",
            });
        }
    }
    catch (error) {
        console.error("Error checking existing guest:", error);
        return res.status(500).json({
            code: 500,
            message: "Error checking existing guest.",
            status: "failed",
        });
    }
    // Hash password if not logged in and not admin, else set to null
    const hashedPassword = !isLoggedIn && !isAdmin && password
        ? yield bcrypt_1.default.hash(password, 10)
        : null;
    // Create guest record
    try {
        const guest = yield client_1.default.guest.create({
            data: {
                name,
                email: isAdmin ? null : email, // Email is null for admin
                username: generatedUsername, // Gunakan username yang digenerate
                phone,
                password: hashedPassword,
                passport,
                dateOfBirth,
                gender: normalizedGender,
                country,
            },
        });
        return res.status(201).json({
            code: 201,
            message: "Guest created successfully.",
            status: "success",
            data: guest,
        });
    }
    catch (error) {
        console.error("Failed to create guest:", error);
        return res.status(500).json({
            code: 500,
            message: "An error occurred while creating the guest.",
            status: "failed",
        });
    }
});
exports.createGuest = createGuest;
// PUT /api/guests/:id - Update guest details
const updateGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, email, username, phone, gender, password, passport, dateOfBirth, country, } = req.body;
    // Normalize gender to proper case
    let normalizedGender = gender;
    if (gender) {
        normalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }
    try {
        const guest = yield client_1.default.guest.findUnique({ where: { id } });
        if (!guest) {
            return res.status(404).json({
                code: 404,
                message: "Guest not found.",
                status: "failed",
            });
        }
        // Check if new email is already used
        if (email && email !== guest.email) {
            const existingEmail = yield client_1.default.guest.findUnique({ where: { email } });
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
            const existingUsername = yield client_1.default.guest.findUnique({
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
        let hashedPassword = undefined;
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    code: 400,
                    message: "Password must be at least 6 characters long.",
                    status: "failed",
                });
            }
            hashedPassword = yield bcrypt_1.default.hash(password, 10);
        }
        if (gender && !["Male", "Female"].includes(normalizedGender)) {
            return res.status(400).json({
                code: 400,
                message: "Gender must be 'Male' or 'Female'.",
                status: "failed",
            });
        }
        const updatedGuest = yield client_1.default.guest.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (email && { email })), (phone && { phone })), (username && { username })), (passport && { passport })), (dateOfBirth && { dateOfBirth })), (country && { country })), (gender && { gender: normalizedGender })), (hashedPassword && { password: hashedPassword })),
        });
        console.log("Updated guest gender to:", normalizedGender);
        return res.status(200).json({
            code: 200,
            message: "Guest updated successfully.",
            status: "success",
            data: updatedGuest,
        });
    }
    catch (error) {
        console.error("Failed to update guest:", error);
        return res.status(500).json({
            code: 500,
            message: "An error occurred while updating the guest.",
            status: "failed",
        });
    }
});
exports.updateGuest = updateGuest;
// DELETE /api/guests/:id - Delete a guest
const deleteGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const guest = yield client_1.default.guest.findUnique({ where: { id } });
        if (!guest) {
            return res.status(404).json({
                code: 404,
                message: "Guest not found.",
                status: "failed",
            });
        }
        // Check if guest has active reservations
        const reservationCount = yield client_1.default.reservation.count({
            where: { guestId: id },
        });
        if (reservationCount > 0) {
            return res.status(400).json({
                code: 400,
                message: `Guest has ${reservationCount} related reservation(s). Unable to delete.`,
                status: "failed",
            });
        }
        yield client_1.default.guest.delete({ where: { id } });
        return res.status(200).json({
            code: 200,
            message: "Guest deleted successfully.",
            status: "success",
        });
    }
    catch (error) {
        console.error("Failed to delete guest:", error);
        return res.status(500).json({
            code: 500,
            message: "An error occurred while deleting the guest.",
            status: "failed",
        });
    }
});
exports.deleteGuest = deleteGuest;
// GET /api/guests/:id - Get guest by ID
const getGuestById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const guest = yield client_1.default.guest.findUnique({ where: { id } });
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
    }
    catch (error) {
        console.error("Failed to retrieve guest details:", error);
        return res.status(500).json({
            code: 500,
            message: "An error occurred while retrieving guest details.",
            status: "failed",
        });
    }
});
exports.getGuestById = getGuestById;
// GET /api/guests - Get all guests with pagination and search
const getAllGuests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, page = "1", limit = "10" } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;
    try {
        const whereClause = search
            ? {
                OR: [
                    {
                        username: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {};
        const [guests, totalGuests] = yield Promise.all([
            client_1.default.guest.findMany({
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
            client_1.default.guest.count({ where: whereClause }),
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
    }
    catch (error) {
        console.error("Failed to retrieve guest list:", error);
        return res.status(500).json({
            code: 500,
            message: "An error occurred while retrieving the guest list.",
            status: "failed",
        });
    }
});
exports.getAllGuests = getAllGuests;
// DELETE /api/guests - Delete all guests
const deleteAllGuests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if there are guests with active reservations
        const guestsWithReservations = yield client_1.default.guest.findMany({
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
        const result = yield client_1.default.guest.deleteMany();
        return res.status(200).json({
            code: 200,
            message: `${result.count} guest(s) deleted successfully.`,
            status: "success",
        });
    }
    catch (error) {
        console.error("Failed to delete all guests:", error);
        return res.status(500).json({
            code: 500,
            message: "An error occurred while deleting all guests.",
            status: "failed",
        });
    }
});
exports.deleteAllGuests = deleteAllGuests;
