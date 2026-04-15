import { Router } from "express";
import {
  createScrim,
  getAllScrims,
  getScrimById,
  updateScrim,
  deleteScrim,
  requestJoinScrim,
  getScrimTeams,
  getScrimTeamById,
  approveTeam,
  rejectTeam,
  submitScrimResult,
  getScrimResult,
} from "./scrim.controller.js";
import { uploadScrimImage } from "../../middlewares/upload.middleware.js";

const router = Router();

// ── Scrim CRUD ─────────────────────────────────────────────────────────────
// POST   /api/v1/scrims
router.post("/", uploadScrimImage, createScrim);

// GET    /api/v1/scrims?status=&game=&platform=&page=&limit=
router.get("/", getAllScrims);

// GET    /api/v1/scrims/:id
router.get("/:id", getScrimById);

// PUT    /api/v1/scrims/:id
router.put("/:id", updateScrim);

// DELETE /api/v1/scrims/:id
router.delete("/:id", deleteScrim);

// ── Team Requests ──────────────────────────────────────────────────────────
// POST   /api/v1/scrims/:id/request
router.post("/:id/request", requestJoinScrim);

// GET    /api/v1/scrims/:id/teams?status=
router.get("/:id/teams", getScrimTeams);

// GET    /api/v1/scrims/:id/teams/:teamId     ← must be BEFORE approve/reject
router.get("/:id/teams/:teamId", getScrimTeamById);

// PATCH  /api/v1/scrims/:id/teams/:teamId/approve
router.patch("/:id/teams/:teamId/approve", approveTeam);

// PATCH  /api/v1/scrims/:id/teams/:teamId/reject
router.patch("/:id/teams/:teamId/reject", rejectTeam);

// ── Results ────────────────────────────────────────────────────────────────
// POST   /api/v1/scrims/:id/result
router.post("/:id/result", submitScrimResult);

// GET    /api/v1/scrims/:id/result
router.get("/:id/result", getScrimResult);

export default router;
