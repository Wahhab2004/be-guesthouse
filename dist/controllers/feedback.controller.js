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
exports.deleteFeedback = exports.updateFeedback = exports.getAllFeedbacks = exports.getFeedbackByReservation = exports.createFeedback = void 0;
const client_1 = __importDefault(require("../prisma/client"));
// Create feedback for a reservation
const createFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const reservation = yield client_1.default.reservation.findUnique({
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
        const existing = yield client_1.default.feedback.findUnique({
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
        const feedback = yield client_1.default.feedback.create({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Terjadi kesalahan saat mengirim feedback",
            status: "gagal",
        });
    }
});
exports.createFeedback = createFeedback;
// Get feedback by reservation ID
const getFeedbackByReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reservationId } = req.params;
    try {
        const feedback = yield client_1.default.feedback.findUnique({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Terjadi kesalahan saat mengambil feedback",
            status: "gagal",
        });
    }
});
exports.getFeedbackByReservation = getFeedbackByReservation;
// Get all feedbacks
const getAllFeedbacks = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const feedbacks = yield client_1.default.feedback.findMany({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Gagal mengambil data feedback",
            status: "gagal",
        });
    }
});
exports.getAllFeedbacks = getAllFeedbacks;
// Update feedback
const updateFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { rating, comment } = req.body;
    try {
        const updated = yield client_1.default.feedback.update({
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
    }
    catch (error) {
        return res.status(500).json({
            code: 500,
            message: "Gagal memperbarui feedback",
            status: "gagal",
        });
    }
});
exports.updateFeedback = updateFeedback;
// Delete feedback
const deleteFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield client_1.default.feedback.delete({
            where: { id },
        });
        return res.status(200).json({
            code: 200,
            message: "Feedback berhasil dihapus",
            status: "sukses",
        });
    }
    catch (error) {
        return res.status(500).json({
            code: 500,
            message: "Gagal menghapus feedback",
            status: "gagal",
        });
    }
});
exports.deleteFeedback = deleteFeedback;
