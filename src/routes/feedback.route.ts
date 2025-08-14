// routes/feedbackRoutes.ts
import express from "express";
import { createFeedback, getFeedbackByReservation, getAllFeedbacks } from "../controllers/feedback.controller";

const router = express.Router();

router.post("/", createFeedback);
router.get("/:reservationId", getFeedbackByReservation);
router.get("/", getAllFeedbacks)


export default router;
