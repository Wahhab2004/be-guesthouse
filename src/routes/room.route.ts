import express from "express";
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms

} from "../controllers/room.controller";
import { upload } from "../lib/upload";

const router = express.Router();

router.get("/", getAllRooms);
router.get("/available", getAvailableRooms);
router.get("/:id", getRoomById);
router.post("/",  upload.single("photoUrl"), createRoom);
router.put("/:id", upload.single("photoUrl"), updateRoom);
router.delete("/:id", deleteRoom);

export default router;

