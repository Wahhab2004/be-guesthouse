import { Router } from "express";
import { getAllCalendarInRange } from "../controllers/calendar.controller";

const router = Router();

router.get("/", getAllCalendarInRange);

export default router;
