"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = require("../middlewares/adminAuth");
const admin_controller_1 = require("../controllers/admin.controller");
const router = express_1.default.Router();
router.use(adminAuth_1.adminAuth); // protect all admin routes);
router.get("/", admin_controller_1.getAllAdmins);
router.post("/", admin_controller_1.createAdmin);
router.put("/:id", admin_controller_1.updateAdmin);
router.delete("/:id", admin_controller_1.deleteAdmin);
exports.default = router;
