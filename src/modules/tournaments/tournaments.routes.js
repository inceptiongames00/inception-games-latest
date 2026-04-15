import { Router } from "express";
import {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  updateBannerUrl,
  deleteTournament,
} from "./tournaments.controller";

const router = Router();

router.post("/create",  createTournament);
router.get("/",         getAllTournaments);
router.get("/:id",      getTournamentById);
router.put("/:id",      updateTournament);
router.delete("/:id",   deleteTournament);
router.patch("/:id/banner", updateBannerUrl);

// ❌ remove these two lines entirely:
// router.post("/:id/register",    registerParticipant);
// router.get("/:id/participants",  getParticipants);

export default router;