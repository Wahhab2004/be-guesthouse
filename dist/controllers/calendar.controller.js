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
exports.getAllCalendarInRange = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const date_fns_1 = require("date-fns");
const getAllCalendarInRange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ambil query parameter
        const { start, end } = req.query;
        // Set default jika tidak ada query
        const today = (0, date_fns_1.startOfDay)(new Date());
        const startDate = start ? new Date(start) : today;
        const endDate = end ? new Date(end) : (0, date_fns_1.addMonths)(today, 6);
        const calendar = yield client_1.default.calendar.findMany({
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
    }
    catch (error) {
        console.error("Gagal mengambil data kalender:", error);
        return res.status(500).json({
            code: 500,
            message: "Terjadi kesalahan saat mengambil data kalender",
            status: "gagal",
        });
    }
});
exports.getAllCalendarInRange = getAllCalendarInRange;
