import { Router } from "express";
import {
	createGuest,
	getAllGuests,
	getGuestById,
	updateGuest,
	deleteGuest,
	deleteAllGuests
} from "../controllers/guest.controller";
import { optionalAuth } from "../middlewares/optionalAuth";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// router.use(guestAuth); // protect all guest routes

// POST /api/guests
router.post("/", optionalAuth(), createGuest); // Create a new guest
router.get("/", getAllGuests); // Get All Guests
router.get("/:id", getGuestById); // Get Guest by ID
router.put("/:id", updateGuest); // Update Guest by ID
router.delete("/all", authMiddleware(["admin"]), deleteAllGuests);
router.delete("/:id", deleteGuest); // Delete Guest by ID


export default router;
