import express from "express";
import {
	createPayment,
	getAllPayments,
	updatePayment,
	deletePayment,
} from "../controllers/payment.controller";

const router = express.Router();

router.post("/", createPayment); // Bisa juga ditambahkan auth jika perlu
router.get("/", getAllPayments);
router.put("/:id", updatePayment); // hanya admin bisa ubah status
router.delete("/:id", deletePayment); // hanya admin bisa hapus

export default router;
