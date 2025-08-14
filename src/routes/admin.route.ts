import express from "express";
import { adminAuth } from "../middlewares/adminAuth";
import {createAdmin, getAllAdmins, updateAdmin, deleteAdmin } from "../controllers/admin.controller";

const router = express.Router();

router.use(adminAuth); // protect all admin routes);
router.get("/", getAllAdmins);
router.post("/", createAdmin);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);


export default router;
