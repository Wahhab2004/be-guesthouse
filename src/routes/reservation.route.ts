import express from "express";
import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
  deleteAllReservations,
} from "../controllers/reservation.controller";
import { upload } from "../lib/upload";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", getAllReservations);
// router.get("/", getFilteredReservations);
router.get("/:id", getReservationById);
router.post("/", createReservation);
router.delete("/all", authMiddleware(["admin"]), deleteAllReservations);

// ✅ gunakan `upload.single('proofUrl')` agar FormData yang berisi file bisa terbaca
router.put("/:id", upload.single("proofUrl"), updateReservation);

router.delete("/:id", deleteReservation);

export default router;
