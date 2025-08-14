"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const room_controller_1 = require("../controllers/room.controller");
const router = express_1.default.Router();
router.get("/", room_controller_1.getAllRooms);
router.get("/available", room_controller_1.getAvailableRooms);
router.get("/:id", room_controller_1.getRoomById);
router.post("/", room_controller_1.createRoom);
router.put("/:id", room_controller_1.updateRoom);
router.delete("/:id", room_controller_1.deleteRoom);
exports.default = router;
