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
exports.deletePayment = exports.updatePayment = exports.getAllPayments = exports.createPayment = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reservationId, method, amount, proofUrl } = req.body;
    if (!reservationId || !method || !amount) {
        return res.status(400).json({
            code: 400,
            message: "Semua field wajib diisi",
            status: "gagal",
        });
    }
    try {
        // Cek apakah reservasi ada
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
        // Cek apakah payment sudah ada
        const existingPayment = yield client_1.default.payment.findUnique({
            where: { reservationId },
        });
        if (existingPayment) {
            return res.status(409).json({
                code: 409,
                message: "Reservasi ini sudah memiliki pembayaran",
                status: "gagal",
            });
        }
        const payment = yield client_1.default.payment.create({
            data: {
                reservationId,
                method,
                amount,
                proofUrl,
                status: "UNPAID", // default, bisa diubah setelah diverifikasi
            },
        });
        return res.status(201).json({
            code: 201,
            message: "Pembayaran berhasil dibuat",
            data: payment,
            status: "sukses",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Gagal membuat pembayaran",
            status: "gagal",
        });
    }
});
exports.createPayment = createPayment;
const getAllPayments = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield client_1.default.payment.findMany({
            select: {
                id: true,
                reservationId: true,
                amount: true,
                method: true,
                status: true,
                proofUrl: true,
                paidAt: true,
            },
        });
        return res.status(200).json({
            code: 200,
            data: payments,
            status: "sukses",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Gagal mengambil data pembayaran",
            status: "gagal",
        });
    }
});
exports.getAllPayments = getAllPayments;
const updatePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status, method, proofUrl, paidAt, paymentSender } = req.body;
    // Validate status if provided
    if (status && !["PAID", "HALF_PAID", "UNPAID", "REFUNDED"].includes(status)) {
        return res.status(400).json({
            code: 400,
            message: "Invalid payment status",
            status: "failed",
        });
    }
    try {
        // Retrieve existing payment data
        const existingPayment = yield client_1.default.payment.findUnique({
            where: { id },
        });
        if (!existingPayment) {
            return res.status(404).json({
                code: 404,
                message: "Payment record not found",
                status: "failed",
            });
        }
        // If proofUrl in DB is still empty/null, request must include proofUrl
        if (!existingPayment.proofUrl && (!proofUrl || proofUrl.trim() === "")) {
            return res.status(400).json({
                code: 400,
                message: "Payment proof (proofUrl) is required",
                status: "failed",
            });
        }
        if (!paymentSender) {
            return res.status(400).json({
                code: 400,
                message: "Payment sender is required",
                status: "failed",
            });
        }
        const updated = yield client_1.default.payment.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (status && { status })), (method && { method })), (proofUrl && { proofUrl })), (paymentSender && { sender: paymentSender })), { paidAt: paidAt ? new Date(paidAt) : new Date() }),
        });
        return res.status(200).json({
            code: 200,
            message: "Payment record has been successfully updated",
            data: updated,
            status: "success",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Failed to update payment record",
            status: "failed",
        });
    }
});
exports.updatePayment = updatePayment;
const deletePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const payment = yield client_1.default.payment.delete({
            where: { id },
        });
        return res.status(200).json({
            code: 200,
            message: "Pembayaran berhasil dihapus",
            data: payment,
            status: "sukses",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Gagal menghapus pembayaran",
            status: "gagal",
        });
    }
});
exports.deletePayment = deletePayment;
