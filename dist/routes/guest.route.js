"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const guest_controller_1 = require("../controllers/guest.controller");
const optionalAuth_1 = require("../middlewares/optionalAuth");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// router.use(guestAuth); // protect all guest routes
// POST /api/guests
router.post("/", (0, optionalAuth_1.optionalAuth)(), guest_controller_1.createGuest); // Create a new guest
router.get("/", guest_controller_1.getAllGuests); // Get All Guests
router.get("/:id", guest_controller_1.getGuestById); // Get Guest by ID
router.put("/:id", guest_controller_1.updateGuest); // Update Guest by ID
router.delete("/all", (0, authMiddleware_1.authMiddleware)(["admin"]), guest_controller_1.deleteAllGuests);
router.delete("/:id", guest_controller_1.deleteGuest); // Delete Guest by ID
exports.default = router;
