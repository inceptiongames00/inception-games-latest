import { Router } from "express";
import {
  registerParticipant,
  getParticipants,
  getParticipantById,
  verifyPayment,
  rejectPayment,
  getPendingPayments,
} from "../participants/participants.controller";

const router = Router({ mergeParams: true }); // mergeParams gives access to :id from parent router

// ── Registration ───────────────────────────────────────────────────────────
// POST   /api/v1/tournaments/:id/register
router.post("/register", registerParticipant);

// ── Participants (admin) ───────────────────────────────────────────────────
// GET    /api/v1/tournaments/:id/participants                   — all (filterable)
// GET    /api/v1/tournaments/:id/participants/pending           — pending payments only
// GET    /api/v1/tournaments/:id/participants/:participantId    — single participant
router.get("/participants", getParticipants);
router.get("/participants/pending", getPendingPayments);
router.get("/participants/:participantId", getParticipantById);

// ── Payment Actions (admin) ────────────────────────────────────────────────
// PATCH  /api/v1/tournaments/:id/participants/:participantId/verify  — approve payment
// PATCH  /api/v1/tournaments/:id/participants/:participantId/reject  — reject payment
router.patch("/participants/:participantId/verify", verifyPayment);
router.patch("/participants/:participantId/reject", rejectPayment);

export default router;
