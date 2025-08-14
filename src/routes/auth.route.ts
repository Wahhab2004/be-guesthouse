import express from "express";
import { loginAdmin, loginGuest } from "../controllers/auth.controller";

const router = express.Router();

router.post("/login", loginGuest);
router.post("/login-admin", loginAdmin);

export default router;
