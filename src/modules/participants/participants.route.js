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
router.get("/participants/my-tournaments", getMyTournaments);
router.post(
  "/participants/:id/submit-payment",
  submitPaymentProof,
);
router.patch("/admin/participants/:id/verify", verifyPayment);
router.patch("/admin/participants/:id/reject", rejectPayment);
router.get("/notifications", getNotifications);
router.patch("/notifications/mark-read", markNotificationsRead);

export default router;
