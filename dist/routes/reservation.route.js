"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reservation_controller_1 = require("../controllers/reservation.controller");
const upload_1 = require("../utilitas/upload");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get("/", reservation_controller_1.getAllReservations);
// router.get("/", getFilteredReservations);
router.get("/:id", reservation_controller_1.getReservationById);
router.post("/", reservation_controller_1.createReservation);
router.delete("/all", (0, authMiddleware_1.authMiddleware)(["admin"]), reservation_controller_1.deleteAllReservations);
// ✅ gunakan `upload.single('proofUrl')` agar FormData yang berisi file bisa terbaca
router.put("/:id", upload_1.upload.single("proofUrl"), reservation_controller_1.updateReservation);
router.delete("/:id", reservation_controller_1.deleteReservation);
exports.default = router;
