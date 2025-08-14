"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
router.post("/", payment_controller_1.createPayment); // Bisa juga ditambahkan auth jika perlu
router.get("/", payment_controller_1.getAllPayments);
router.put("/:id", payment_controller_1.updatePayment); // hanya admin bisa ubah status
router.delete("/:id", payment_controller_1.deletePayment); // hanya admin bisa hapus
exports.default = router;
