import {
  registerParticipantService,
  getParticipantsService,
  getParticipantByIdService,
  verifyPaymentService,
  rejectPaymentService,
  getPendingPaymentsService,
} from "./participants.service";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER FOR TOURNAMENT
// POST /api/v1/tournaments/:id/register
// ─────────────────────────────────────────────────────────────────────────────
export const registerParticipant = async (req, res, next) => {
  console.log("🔵 registerParticipant hit"); // ← add this
  try {
    const result = await registerParticipantService(req.params.id, req.body);
    console.log("🟢 service returned"); // ← add this
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    console.log("🔴 error caught:", err); // ← add this
    next(err);
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PARTICIPANTS
// GET /api/v1/tournaments/:id/participants?payment_status=Pending&status=Confirmed
// ─────────────────────────────────────────────────────────────────────────────
export const getParticipants = async (req, res, next) => {
  try {
    const { payment_status, status } = req.query;
    const result = await getParticipantsService(req.params.id, {
      payment_status,
      status,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE PARTICIPANT
// GET /api/v1/tournaments/:id/participants/:participantId
// ─────────────────────────────────────────────────────────────────────────────
export const getParticipantById = async (req, res, next) => {
  try {
    const result = await getParticipantByIdService(
      req.params.id,
      req.params.participantId,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY PAYMENT  (admin)
// PATCH /api/v1/tournaments/:id/participants/:participantId/verify
// body: { verified_by?, note? }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res, next) => {
  try {
    const result = await verifyPaymentService(
      req.params.id,
      req.params.participantId,
      req.body,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REJECT PAYMENT  (admin)
// PATCH /api/v1/tournaments/:id/participants/:participantId/reject
// body: { verified_by?, note }
// ─────────────────────────────────────────────────────────────────────────────
export const rejectPayment = async (req, res, next) => {
  try {
    const result = await rejectPaymentService(
      req.params.id,
      req.params.participantId,
      req.body,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PENDING PAYMENTS  (admin dashboard)
// GET /api/v1/tournaments/:id/participants/pending
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingPayments = async (req, res, next) => {
  try {
    const result = await getPendingPaymentsService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
