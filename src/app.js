import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import errorHandler from "./helper/errorhandler.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import tournamentRoutes from "./modules/tournaments/tournaments.routes.js";
import participantRoutes from "./modules/participants/participants.route.js";
import eventRoutes from "./modules/events/event.route.js";
import scrimRoutes from "./modules/scrims/scrim.route.js";
import brandDeals from "./modules/Brand_deals/brand.route.js"
import contactRoutes from "./modules/contact/contact.route.js";

dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Slice N Share API is running 🎮",
    version: "1.0.0",
  });
});

// ── API Routes ───────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tournaments", tournamentRoutes);
app.use("/api/v1/participants", participantRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/scrims", scrimRoutes);
app.use("/api/v1/brand-deals", brandDeals);
app.use("/api/v1/contact", contactRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

export default app;
