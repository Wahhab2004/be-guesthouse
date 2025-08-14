"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const room_route_1 = __importDefault(require("./routes/room.route"));
const reservation_route_1 = __importDefault(require("./routes/reservation.route"));
const guest_route_1 = __importDefault(require("./routes/guest.route"));
const calendar_route_1 = __importDefault(require("./routes/calendar.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const feedback_route_1 = __importDefault(require("./routes/feedback.route"));
const additionalGuest_route_1 = __importDefault(require("./routes/additionalGuest.route"));
const protectedRoutes_1 = __importDefault(require("./routes/protectedRoutes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../public/uploads")));
// Routes
app.use("/api/rooms", room_route_1.default);
app.use("/api/reservations", reservation_route_1.default);
app.use("/api/guests", guest_route_1.default);
app.use("/api/calendar", calendar_route_1.default);
app.use("/api/admin", admin_route_1.default);
app.use("/api", auth_route_1.default);
app.use("/api/payments", payment_route_1.default);
app.use("/api/feedback", feedback_route_1.default);
app.use("/api/additional-guests", additionalGuest_route_1.default);
app.use("/", protectedRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Guesthouse Backend API is running!");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
exports.default = app;
