// participants.controller.js
import { uploadPaymentScreenshot } from "../../middlewares/upload.middleware.js";
import {
  registerParticipantService,
  getMyTournamentsService,
  submitPaymentProofService,
  verifyPaymentService,
  rejectPaymentService,
  getNotificationsService,
  markNotificationsReadService,
} from "./participants.service.js";

export const registerParticipant = async (req, res) => {
  try {
    const result = await registerParticipantService(req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getMyTournaments = async (req, res) => {
  try {
    const data = await getMyTournamentsService(req.query.email);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const submitPaymentProof = async (req, res) => {
  try {
    const { trx_id } = req.body;
    const userEmail = req.query.email || req.body.email;

    let screenshot_url = null;
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      screenshot_url = await uploadPaymentScreenshot(
        dataUrl,
        `payment-screenshots/${req.params.id}_${Date.now()}.png`,
      );
    }

    const result = await submitPaymentProofService(req.params.id, userEmail, {
      trx_id,
      screenshot_url,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const result = await verifyPaymentService(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const rejectPayment = async (req, res) => {
  try {
    const result = await rejectPaymentService(req.params.id, req.body.reason);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const data = await getNotificationsService(req.query.email);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const result = await markNotificationsReadService(req.query.email);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
