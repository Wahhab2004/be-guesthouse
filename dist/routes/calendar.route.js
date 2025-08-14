"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendar_controller_1 = require("../controllers/calendar.controller");
const router = (0, express_1.Router)();
router.get("/", calendar_controller_1.getAllCalendarInRange);
exports.default = router;
