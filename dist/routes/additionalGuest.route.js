"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const additionalGuest_controller_1 = require("../controllers/additionalGuest.controller");
const router = express_1.default.Router();
router.post("/", additionalGuest_controller_1.createAdditionalGuest);
router.get("/:reservationId", additionalGuest_controller_1.getGuestsByReservation);
router.delete("/:id", additionalGuest_controller_1.deleteAdditionalGuest);
router.put("/:id", additionalGuest_controller_1.updateAdditionalGuest);
router.get("/all/:reservationId", additionalGuest_controller_1.getAllGuestsInReservation);
exports.default = router;
