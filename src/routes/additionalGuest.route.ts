import express from "express";
import {
	createAdditionalGuest,
	getGuestsByReservation,
	deleteAdditionalGuest,
	updateAdditionalGuest,
	getAllGuestsInReservation,
} from "../controllers/additionalGuest.controller";

const router = express.Router();

router.post("/", createAdditionalGuest); 
router.get("/:reservationId", getGuestsByReservation); 
router.delete("/:id", deleteAdditionalGuest); 
router.put("/:id", updateAdditionalGuest); 
router.get("/all/:reservationId", getAllGuestsInReservation); 

export default router;
