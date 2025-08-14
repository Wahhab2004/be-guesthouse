"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get("/dasbor", (0, authMiddleware_1.authMiddleware)(["admin"]), (req, res) => {
    res.json({ message: "Welcome Admin Dashboard" });
});
router.get("/guest-reservation", (0, authMiddleware_1.authMiddleware)(["admin"]), (req, res) => {
    res.json({ message: "Guest Reservation Page" });
});
router.get("/room", (0, authMiddleware_1.authMiddleware)(["admin"]), (req, res) => {
    res.json({ message: "Room List" });
});
exports.default = router;
