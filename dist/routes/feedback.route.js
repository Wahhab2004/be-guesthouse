"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/feedbackRoutes.ts
const express_1 = __importDefault(require("express"));
const feedback_controller_1 = require("../controllers/feedback.controller");
const router = express_1.default.Router();
router.post("/", feedback_controller_1.createFeedback);
router.get("/:reservationId", feedback_controller_1.getFeedbackByReservation);
router.get("/", feedback_controller_1.getAllFeedbacks);
exports.default = router;
