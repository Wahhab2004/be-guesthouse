import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import roomRoutes from "./routes/room.route";
import reservationRoutes from "./routes/reservation.route";
import guestRoutes from "./routes/guest.route"; 
import calendarRoutes from "./routes/calendar.route";
import adminRoutes from "./routes/admin.route";
import authRoutes from "./routes/auth.route";
import paymentRoutes from "./routes/payment.route";
import feedbackRoutes from "./routes/feedback.route";
import additonalGuestRoutes from "./routes/additionalGuest.route";
import router from "./routes/protectedRoutes";
import path from "path";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));


// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/additional-guests", additonalGuestRoutes);

app.use("/", router);

app.get("/", (req, res) => {
  res.send("Guesthouse Backend API is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;