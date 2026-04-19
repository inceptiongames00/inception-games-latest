// participants.route.js
import express from "express";
import {
  registerParticipant,
  getMyTournaments,
  submitPaymentProof,
  verifyPayment,
  rejectPayment,
  getNotifications,
  markNotificationsRead,
} from "./participants.controller.js";

const router = express.Router();

router.post("/tournaments/:id/register", registerParticipant);
router.get("/my-tournaments", getMyTournaments);
router.post(
  "/:id/submit-payment",
  submitPaymentProof,
);
router.patch("/admin/:id/verify", verifyPayment);
router.patch("/admin/:id/reject", rejectPayment);
router.get("/notifications", getNotifications);
router.patch("/notifications/mark-read", markNotificationsRead);

export default router;
