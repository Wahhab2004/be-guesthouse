import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/dasbor", authMiddleware(["admin"]), (req, res) => {
	res.json({ message: "Welcome Admin Dashboard" });
});

router.get("/guest-reservation", authMiddleware(["admin"]), (req, res) => {
	res.json({ message: "Guest Reservation Page" });
});

router.get("/room", authMiddleware(["admin"]), (req, res) => {
	res.json({ message: "Room List" });
});

export default router;
