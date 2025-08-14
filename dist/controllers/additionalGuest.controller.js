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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGuestsInReservation = exports.updateAdditionalGuest = exports.deleteAdditionalGuest = exports.getGuestsByReservation = exports.createAdditionalGuest = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createAdditionalGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reservationId, name, passport, dateOfBirth, gender } = req.body;
        // Gender enum validation (optional)
        const allowedGenders = ["Male", "Female"];
        if (gender && !allowedGenders.includes(gender)) {
            return res.status(400).json({
                status: "error",
                message: `Invalid gender. Please use one of: ${allowedGenders.join(", ")}`,
                data: null,
            });
        }
        // Check if reservation exists
        const reservation = yield prisma.reservation.findUnique({
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
        const totalGuests = yield prisma.additionalGuest.count({
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
        const guest = yield prisma.additionalGuest.create({
            data: {
                reservationId,
                name,
                passport,
                dateOfBirth,
                gender,
            },
        });
        return res.status(201).json({
            status: "success",
            message: "Additional guest successfully added",
            data: guest,
        });
    }
    catch (error) {
        console.error("[createAdditionalGuest]", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred on the server while adding the guest",
            data: null,
        });
    }
});
exports.createAdditionalGuest = createAdditionalGuest;
const getGuestsByReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reservationId } = req.params;
    try {
        const guests = yield prisma.additionalGuest.findMany({
            where: { reservationId },
        });
        res.json(guests);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getGuestsByReservation = getGuestsByReservation;
const deleteAdditionalGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.additionalGuest.delete({
            where: { id },
        });
        res.json({ message: "Guest deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.deleteAdditionalGuest = deleteAdditionalGuest;
const updateAdditionalGuest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, passport, dateOfBirth, gender } = req.body;
    try {
        const guest = yield prisma.additionalGuest.update({
            where: { id },
            data: {
                name,
                passport,
                dateOfBirth,
                gender,
            },
        });
        res.json({ message: "Guest updated successfully", data: guest });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.updateAdditionalGuest = updateAdditionalGuest;
const getAllGuestsInReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { reservationId } = req.params;
    try {
        const reservation = yield prisma.reservation.findUnique({
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
                name: (_a = reservation.guest) === null || _a === void 0 ? void 0 : _a.name,
                passport: (_b = reservation.guest) === null || _b === void 0 ? void 0 : _b.passport,
                dateOfBirth: (_c = reservation.guest) === null || _c === void 0 ? void 0 : _c.dateOfBirth,
                gender: ((_d = reservation.guest) === null || _d === void 0 ? void 0 : _d.gender) || null,
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
    }
    catch (error) {
        console.error("[getAllGuestsInReservation]", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred on the server while retrieving the guest list",
            data: null,
        });
    }
});
exports.getAllGuestsInReservation = getAllGuestsInReservation;
