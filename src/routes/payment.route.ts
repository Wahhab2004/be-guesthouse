import express from "express";
import {
	createPayment,
	getAllPayments,
	updatePayment,
	deletePayment,
} from "../controllers/payment.controller";
import { upload } from "../lib/upload";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", createPayment); // Bisa juga ditambahkan auth jika perlu
router.get("/", getAllPayments);
router.put("/:id",upload.single('proofUrl'),updatePayment); // hanya admin bisa ubah status
router.delete("/:id", deletePayment); // hanya admin bisa hapus

export default router;
