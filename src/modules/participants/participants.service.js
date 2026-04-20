import pool from "../../database/db.js";
import sendEmail from "../../utils/sendEmail.js";
import {
  registrationEmail,
  paymentEmail,
  paymentVerifiedEmail,
  paymentRejectedEmail,
} from "../../helper/emailtemplate.js"

const BKASH_NUMBER = process.env.BKASH_NUMBER; // set in .env

const generateReference = (id) => `IG-${String(1000 + id).padStart(6, "0")}`;

export const registerParticipantService = async (tournamentId, data) => {
  const { full_name, email, phone, in_game_name, in_game_id, discord_id } =
    data;

  // ── Validation ──────────────────────────────────────────────
  if (!full_name) throw { status: 400, message: "Full name is required" };
  if (!email) throw { status: 400, message: "Email address is required" };
  if (!phone) throw { status: 400, message: "Phone number is required" };

  // ── Fetch tournament ────────────────────────────────────────
  const [tournamentRows] = await pool.query(
    `SELECT id, title, game, game_mode, platform, status,
            filled_slots, max_slots, reg_fee, prize_pool, currency, event_date
     FROM tournaments WHERE id = ?`,
    [tournamentId],
  );
  if (!tournamentRows.length)
    throw { status: 404, message: "Tournament not found" };

  const tournament = tournamentRows[0];

  if (!["Upcoming", "Active"].includes(tournament.status))
    throw {
      status: 400,
      message: "Registration is not open for this tournament",
    };

  // ── Duplicate check ─────────────────────────────────────────
  const [dupEmail] = await pool.query(
    `SELECT id FROM tournament_participants WHERE tournament_id = ? AND email = ?`,
    [tournamentId, email],
  );
  if (dupEmail.length)
    throw {
      status: 409,
      message: "This email is already registered for this tournament",
    };

  // ── DB transaction ──────────────────────────────────────────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insertResult] = await conn.query(
      `INSERT INTO tournament_participants
       (tournament_id, full_name, email, phone, in_game_name, in_game_id,
        discord_id, reg_fee, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending')`,
      [
        tournamentId,
        full_name,
        email,
        phone,
        in_game_name,
        in_game_id,
        discord_id || null,
        tournament.reg_fee || 0,
      ],
    );

    const participantId = insertResult.insertId;

    // ── Generate reference number & save immediately ────────
    const reference = generateReference(participantId);

    await conn.query(
      `UPDATE tournament_participants SET payment_reference = ? WHERE id = ?`,
      [reference, participantId],
    );

    await conn.query(
      `UPDATE tournaments SET filled_slots = filled_slots + 1 WHERE id = ?`,
      [tournamentId],
    );

    await conn.commit();
    conn.release();

    // ── Fetch full record ───────────────────────────────────
    const [rows] = await pool.query(
      `SELECT * FROM tournament_participants WHERE id = ?`,
      [participantId],
    );
    const registration = rows[0];

    // ── Send registration email (non-blocking) ──────────────
    sendEmail({
      to: email,
      subject: `✅ Registration Received — ${tournament.title}`,
      html: registrationEmail(registration, tournament, reference), // pass reference
    }).catch((e) =>
      console.error("[Mail] Registration email failed:", e.message),
    );

    // ── Send payment details email (non-blocking) ───────────
    _sendPaymentEmail(registration, tournament, participantId, reference).catch(
      (e) => console.error("[Mail] Payment email failed:", e.message),
    );

    return {
      message: "Registration submitted! Check your email for payment details.",
      reference,
      registration,
    };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};


export const submitPaymentProofService = async (
  participantId,
  userEmail,
  data,
) => {
  const { trx_id, reference } = data;

  if (!trx_id) throw { status: 400, message: "Transaction ID is required" };
  if (!reference)
    throw { status: 400, message: "Payment reference is required" };

  // ── Verify participant ──────────────────────────────────────
  const [rows] = await pool.query(
    `SELECT tp.*, t.title AS tournament_title, t.id AS tournament_id, t.reg_fee, t.game, t.currency
     FROM tournament_participants tp
     JOIN tournaments t ON t.id = tp.tournament_id
     WHERE tp.id = ? AND tp.email = ?`,
    [participantId, userEmail],
  );
  if (!rows.length) throw { status: 404, message: "Registration not found" };

  const participant = rows[0];

  // ── Match reference number ──────────────────────────────────
  if (participant.payment_reference !== reference)
    throw { status: 400, message: "Invalid payment reference number" };

  if (participant.payment_status === "Verified")
    throw { status: 400, message: "Payment is already verified" };

  // ── Check trx_id not already used ──────────────────────────
  const [dupTrx] = await pool.query(
    `SELECT id FROM tournament_participants WHERE submission_trx_id = ? AND id != ?`,
    [trx_id, participantId],
  );
  if (dupTrx.length)
    throw {
      status: 409,
      message: "This Transaction ID has already been submitted",
    };

  // ── Update DB ───────────────────────────────────────────────
  await pool.query(
    `UPDATE tournament_participants
     SET submission_trx_id = ?,
         payment_status = 'Submitted',
         payment_submitted_at = NOW()
     WHERE id = ?`,
    [trx_id, participantId],
  );

  // ── Send confirmation email ─────────────────────────────────
  const tournament = {
    title: participant.tournament_title,
    game: participant.game,
    reg_fee: participant.reg_fee,
    currency: participant.currency,
  };

  const p = {
    full_name: participant.full_name,
    in_game_name: participant.in_game_name,
    email: participant.email,
  };

  sendEmail({
    to: participant.email,
    subject: `Payment Submitted — Ref: ${reference}`,
    html: paymentEmail(p, tournament, trx_id, reference),
  }).catch((e) =>
    console.error("[Mail] Payment confirmation email failed:", e.message),
  );

  return {
    message: "Payment proof submitted successfully. Under review.",
    reference,
    trx_id,
  };
};

export const getMyTournamentsService = async (email) => {
  if (!email) throw { status: 400, message: "Email is required" };

  const [rows] = await pool.query(
    `SELECT
       tp.id            AS participant_id,
       tp.full_name,
       tp.in_game_name,
       tp.phone,
       tp.payment_status,
       tp.status        AS participant_status,
       tp.registered_at    AS registered_at,
       t.id             AS tournament_id,
       t.title,
       t.game,
       t.game_mode,
       t.platform,
       t.reg_fee,
       t.currency,
       t.prize_pool,
       t.event_date,
       t.status         AS tournament_status
     FROM tournament_participants tp
     JOIN tournaments t ON t.id = tp.tournament_id
     WHERE tp.email = ?
     ORDER BY tp.registered_at DESC`,
    [email],
  );

  return rows;
};
 


const _sendPaymentEmail = async (
  registration,
  tournament,
  participantId,
  reference,
) => {
  const bkashNumber = process.env.BKASH_NUMBER; // or however you store it

  await sendEmail({
    to: registration.email,
    subject: `💳 Complete Your Payment — ${tournament.title}`,
    html: paymentEmail(registration, tournament, bkashNumber, reference), // ✅ reference 4th param
  });
};





export const getParticipantsService = async (
  tournamentId,
  { payment_status, status } = {},
) => {
  const [tournament] = await pool.query(
    `SELECT id, title, filled_slots, max_slots FROM tournaments WHERE id = ?`,
    [tournamentId],
  );
  if (tournament.length === 0)
    throw { status: 404, message: "Tournament not found" };

  const conditions = ["tournament_id = ?"];
  const params = [tournamentId];

  if (payment_status) {
    conditions.push("payment_status = ?");
    params.push(payment_status);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  const [participants] = await pool.query(
    `SELECT
       id, tournament_id, full_name, email, phone,
       in_game_name, in_game_id, discord_id,
       reg_fee, trx_id, payment_method,
       payment_status, payment_note, payment_verified_at, payment_verified_by,
       status, registered_at
     FROM tournament_participants
     WHERE ${conditions.join(" AND ")}
     ORDER BY registered_at ASC`,
    params,
  );

  const [summary] = await pool.query(
    `SELECT
       COUNT(*)                         AS total,
       SUM(payment_status = 'Pending')  AS pending_payment,
       SUM(payment_status = 'Verified') AS verified_payment,
       SUM(payment_status = 'Rejected') AS rejected_payment,
       SUM(status = 'Confirmed')        AS confirmed,
       SUM(status = 'Disqualified')     AS disqualified
     FROM tournament_participants WHERE tournament_id = ?`,
    [tournamentId],
  );

  return {
    tournament_id: Number(tournamentId),
    tournament_title: tournament[0].title,
    summary: summary[0],
    participants,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE PARTICIPANT
// GET /api/v1/tournaments/:id/participants/:participantId
// ─────────────────────────────────────────────────────────────────────────────
export const getParticipantByIdService = async (
  tournamentId,
  participantId,
) => {
  const [rows] = await pool.query(
    `SELECT * FROM tournament_participants WHERE id = ? AND tournament_id = ?`,
    [participantId, tournamentId],
  );
  if (rows.length === 0)
    throw { status: 404, message: "Participant not found" };

  return { participant: rows[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY PAYMENT  (admin)
// PATCH /api/v1/tournaments/:id/participants/:participantId/verify
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPaymentService = async (
  tournamentId,
  participantId,
  { verified_by, note } = {},
) => {
  const [participantRows] = await pool.query(
    `SELECT * FROM tournament_participants WHERE id = ? AND tournament_id = ?`,
    [participantId, tournamentId],
  );
  if (participantRows.length === 0)
    throw { status: 404, message: "Participant not found" };
  if (participantRows[0].payment_status === "Verified")
    throw { status: 400, message: "Payment already verified" };

  await pool.query(
    `UPDATE tournament_participants
     SET payment_status = 'Verified', payment_note = ?,
         payment_verified_at = NOW(), payment_verified_by = ?, status = 'Confirmed'
     WHERE id = ?`,
    [note || null, verified_by || "admin", participantId],
  );

  const [updated] = await pool.query(
    `SELECT * FROM tournament_participants WHERE id = ?`,
    [participantId],
  );
  const participant = updated[0];

  const [tournamentRows] = await pool.query(
    `SELECT id, title, game, game_mode, platform, event_date, prize_pool, currency
     FROM tournaments WHERE id = ?`,
    [tournamentId],
  );
  const tournament = tournamentRows[0];

  try {
    await sendMail({
      to: participant.email,
      subject: `🎉 Payment Confirmed — You're in! ${tournament.title}`,
      html: paymentVerifiedEmail(participant, tournament),
    });
  } catch (mailErr) {
    console.error("Verify payment email failed:", mailErr.message);
  }

  return {
    message: "Payment verified and participant confirmed!",
    participant,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// REJECT PAYMENT  (admin)
// PATCH /api/v1/tournaments/:id/participants/:participantId/reject
// ─────────────────────────────────────────────────────────────────────────────
export const rejectPaymentService = async (
  tournamentId,
  participantId,
  { verified_by, note } = {},
) => {
  const [participantRows] = await pool.query(
    `SELECT * FROM tournament_participants WHERE id = ? AND tournament_id = ?`,
    [participantId, tournamentId],
  );
  if (participantRows.length === 0)
    throw { status: 404, message: "Participant not found" };
  if (participantRows[0].payment_status === "Rejected")
    throw { status: 400, message: "Payment already rejected" };

  await pool.query(
    `UPDATE tournament_participants
     SET payment_status = 'Rejected', payment_note = ?,
         payment_verified_at = NOW(), payment_verified_by = ?, status = 'Cancelled'
     WHERE id = ?`,
    [note || null, verified_by || "admin", participantId],
  );

  await pool.query(
    `UPDATE tournaments SET filled_slots = GREATEST(filled_slots - 1, 0) WHERE id = ?`,
    [tournamentId],
  );

  const [updated] = await pool.query(
    `SELECT * FROM tournament_participants WHERE id = ?`,
    [participantId],
  );
  const participant = updated[0];

  const [tournamentRows] = await pool.query(
    `SELECT id, title, game, game_mode, platform, event_date, prize_pool, currency
     FROM tournaments WHERE id = ?`,
    [tournamentId],
  );
  const tournament = tournamentRows[0];

  try {
    await sendMail({
      to: participant.email,
      subject: `❌ Payment Rejected — ${tournament.title}`,
      html: paymentRejectedEmail(participant, tournament),
    });
  } catch (mailErr) {
    console.error("Reject payment email failed:", mailErr.message);
  }

  return {
    message: "Payment rejected and registration cancelled.",
    participant,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PENDING PAYMENTS  (admin dashboard)
// GET /api/v1/tournaments/:id/participants/pending
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingPaymentsService = async (tournamentId) => {
  const [tournament] = await pool.query(
    `SELECT id, title FROM tournaments WHERE id = ?`,
    [tournamentId],
  );
  if (tournament.length === 0)
    throw { status: 404, message: "Tournament not found" };

  const [participants] = await pool.query(
    `SELECT id, full_name, email, phone, in_game_name, in_game_id,
            reg_fee, trx_id, payment_method, payment_status, registered_at
     FROM tournament_participants
     WHERE tournament_id = ? AND payment_status = 'Pending'
     ORDER BY registered_at ASC`,
    [tournamentId],
  );

  return {
    tournament_id: Number(tournamentId),
    tournament_title: tournament[0].title,
    total_pending: participants.length,
    participants,
  };
};

export const getNotificationsService = async (email) => {
  if (!email) throw { status: 400, message: 'Email is required' };
  const [rows] = await pool.query(
    `SELECT id, type, title, message, tournament_id, participant_id, is_read, created_at
     FROM notifications
     WHERE user_email = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [email],
  );
  return rows;
};

export const markNotificationsReadService = async (email) => {
  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_email = ? AND is_read = 0`,
    [email],
  );
  return { message: "All notifications marked as read." };
};
