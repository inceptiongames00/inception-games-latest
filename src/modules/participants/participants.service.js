import pool from "../../database/db.js";
import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// MAILER SETUP
// ─────────────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Inception Games 🎮" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const registrationEmail = (p, t) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">
  <div style="background:linear-gradient(135deg,#a855f7,#6366f1);padding:32px;text-align:center;">
    <h1 style="margin:0;font-size:26px;letter-spacing:1px;">Inception Games</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">Tournament Registration Received 🎮</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Hey <strong style="color:#a855f7;">${p.full_name}</strong>, your registration for
      <strong>${t.title}</strong> has been received!
    </p>

    <div style="background:linear-gradient(135deg,#1e1b4b,#2e1065);border:1px solid #a855f7;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 12px;font-size:14px;color:#e2e8f0;line-height:1.6;">
        🎉 <strong style="color:#fff;">Registration Update:</strong> Thank you for your interest!
        Please join our Discord to get started. Note that we will be sending the
        <strong style="color:#facc15;">Payment QR Code</strong> via a separate email shortly.
      </p>
      <a href="https://discord.gg/qGsn6T3hFT"
         style="display:inline-block;background:linear-gradient(135deg,#5865f2,#4752c4);color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:.5px;">
        🎮 Join Our Discord
      </a>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#a855f7;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📋 Your Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#aaa;width:45%;">Full Name</td><td style="padding:8px 0;font-weight:bold;">${p.full_name}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Email</td><td style="padding:8px 0;">${p.email}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Phone</td><td style="padding:8px 0;">${p.phone}</td></tr>
      </table>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#6366f1;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🏆 Tournament Details</h3>
      <p style="color:#aaa;font-size:14px;margin:0;text-align:center;padding:16px 0;">
        <span style="font-size:28px;">🚧</span><br/>
        <strong style="color:#fff;">Coming Soon</strong><br/>
        <span style="font-size:13px;">Tournament details will be shared with you shortly.</span>
      </p>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#facc15;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">💳 Payment Information</h3>
      <p style="color:#aaa;font-size:14px;margin:0;">
        We will send you a <strong style="color:#facc15;">separate email</strong> with the Payment QR Code and full instructions shortly. Please wait for that email before making any payment.
      </p>
    </div>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#4ade80;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📬 Contact Us</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#aaa;width:45%;">Email</td>  
            <td style="padding:8px 0;"><a href="mailto:contact@inception.games" style="color:#a855f7;">contact@inception.games</a></td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Website</td>  
            <td style="padding:8px 0;"><a href="https://www.inception.games" style="color:#a855f7;">www.inception.games</a></td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Facebook</td>  
            <td style="padding:8px 0;"><a href="#" style="color:#a855f7;">Inception Games</a></td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Discord</td>  
            <td style="padding:8px 0;"><a href="https://discord.gg/qGsn6T3hFT" style="color:#a855f7;">discord.gg/qGsn6T3hFT</a></td></tr>
      </table>
    </div>

  </div>
  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} Inception Games. All rights reserved.</p>
  </div>
</div>`;

const paymentVerifiedEmail = (p, t) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">
  <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">✅</div>
    <h1 style="margin:0;font-size:24px;">Payment Confirmed!</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">You're officially in the tournament</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Great news, <strong style="color:#4ade80;">${p.full_name}</strong>! 🎉<br/>
      Your payment for <strong>${t.title}</strong> has been <strong style="color:#4ade80;">verified</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="background:#14532d;color:#4ade80;padding:10px 28px;border-radius:30px;font-size:15px;font-weight:bold;display:inline-block;">✅ Registration Confirmed</span>
    </div>
    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#4ade80;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🎮 Your Registration</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#aaa;width:45%;">Tournament</td>  <td style="padding:8px 0;font-weight:bold;">${t.title}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Game</td>                  <td style="padding:8px 0;">${t.game} · ${t.game_mode}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Event Date</td>            <td style="padding:8px 0;font-weight:bold;color:#a855f7;">${new Date(t.event_date).toDateString()}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">In-Game Name</td>          <td style="padding:8px 0;font-weight:bold;color:#a855f7;">${p.in_game_name}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">In-Game ID</td>            <td style="padding:8px 0;">${p.in_game_id}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Amount Paid</td>           <td style="padding:8px 0;font-weight:bold;color:#4ade80;">${t.currency} ${Number(p.reg_fee).toLocaleString()}</td></tr>
        ${p.payment_note ? `<tr><td style="padding:8px 0;color:#aaa;">Note</td><td style="padding:8px 0;color:#aaa;font-size:13px;">${p.payment_note}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#aaa;font-size:13px;text-align:center;">Good luck! Stay tuned for updates 📢</p>
  </div>
  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} inception games. All rights reserved.</p>
  </div>
</div>`;

const paymentRejectedEmail = (p, t) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0f1a;border-radius:16px;overflow:hidden;color:#fff;">
  <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">❌</div>
    <h1 style="margin:0;font-size:24px;">Payment Rejected</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:14px;">Your registration could not be confirmed</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;margin-top:0;">
      Hi <strong>${p.full_name}</strong>,<br/>
      Your payment for <strong>${t.title}</strong> could not be verified.
    </p>
    <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
      <h3 style="color:#f87171;margin-top:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">❌ Rejection Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#aaa;width:45%;">Tournament</td>    <td style="padding:8px 0;font-weight:bold;">${t.title}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Transaction ID</td>          <td style="padding:8px 0;font-family:monospace;color:#facc15;">${p.trx_id}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa;">Payment Method</td>          <td style="padding:8px 0;">${p.payment_method}</td></tr>
        ${p.payment_note ? `<tr><td style="padding:8px 0;color:#aaa;">Reason</td><td style="padding:8px 0;color:#f87171;font-weight:bold;">${p.payment_note}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#aaa;font-size:14px;">Contact support with your transaction screenshot if you believe this is a mistake.</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="mailto:support@slicenshare.com"
         style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
        Contact Support
      </a>
    </div>
  </div>
  <div style="background:#0a0a14;padding:16px;text-align:center;">
    <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} inception games. All rights reserved.</p>
  </div>
</div>`;

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER FOR TOURNAMENT
// POST /api/v1/tournaments/:id/register
// ─────────────────────────────────────────────────────────────────────────────
export const registerParticipantService = async (tournamentId, data) => {
  const {
    full_name,
    email,
    phone,
    in_game_name,
    in_game_id,
    discord_id,
    trx_id,
    payment_method = "bKash",
  } = data;

  // ── Validation ─────────────────────────────────────────────
  if (!full_name) throw { status: 400, message: "Full name is required" };
  if (!email) throw { status: 400, message: "Email address is required" };
  if (!phone) throw { status: 400, message: "Phone number is required" };
  // if (!in_game_name) throw { status: 400, message: "In-Game Name is required" };
  // if (!in_game_id) throw { status: 400, message: "In-Game ID is required" };
  // if (!trx_id)
  //   throw { status: 400, message: "Transaction ID (Trx ID) is required" };

  // ── Tournament checks ──────────────────────────────────────
  const [tournamentRows] = await pool.query(
    `SELECT id, title, game, game_mode, platform, status,
            filled_slots, max_slots, reg_fee, prize_pool, currency, event_date
     FROM tournaments WHERE id = ?`,
    [tournamentId],
  );
  if (tournamentRows.length === 0)
    throw { status: 404, message: "Tournament not found" };

  const tournament = tournamentRows[0];

  if (tournament.status !== "Upcoming" && tournament.status !== "Active")
    throw {
      status: 400,
      message: "Registration is not open for this tournament",
    };

  // ── Duplicate checks ───────────────────────────────────────
  const [dupEmail] = await pool.query(
    `SELECT id FROM tournament_participants WHERE tournament_id = ? AND email = ?`,
    [tournamentId, email],
  );
  if (dupEmail.length > 0)
    throw {
      status: 409,
      message: "This email is already registered for this tournament",
    };

  const [dupTrx] = await pool.query(
    `SELECT id FROM tournament_participants WHERE trx_id = ?`,
    [trx_id],
  );
  if (dupTrx.length > 0)
    throw { status: 409, message: "This Transaction ID has already been used" };

  // ── Transaction: insert participant + increment slot ───────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insertResult] = await conn.query(
      `INSERT INTO tournament_participants
         (tournament_id, full_name, email, phone, in_game_name, in_game_id,
          discord_id, reg_fee, trx_id, payment_method, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending')`,
      [
        tournamentId,
        full_name,
        email,
        phone,
        in_game_name,
        in_game_id,
        discord_id || null,
        tournament.reg_fee || 0,
        trx_id,
        payment_method,
      ],
    );

    await conn.query(
      `UPDATE tournaments SET filled_slots = filled_slots + 1 WHERE id = ?`,
      [tournamentId],
    );

    await conn.commit();
    conn.release();

    // ── Fetch the inserted record ──────────────────────────
    const [rows] = await pool.query(
      `SELECT * FROM tournament_participants WHERE id = ?`,
      [insertResult.insertId],
    );
    const registration = rows[0];

    // ── Send confirmation email (non-blocking) ─────────────
    try {
      await sendMail({
        to: email,
        subject: `✅ Registration Received — ${tournament.title}`,
        html: registrationEmail(registration, tournament),
      });
    } catch (mailErr) {
      console.error("Registration email failed:", mailErr.message);
    }

    return {
      message:
        "Registration submitted! Check your email for details. Payment verification is pending.",
      registration,
    };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PARTICIPANTS
// GET /api/v1/tournaments/:id/participants?payment_status=&status=
// ─────────────────────────────────────────────────────────────────────────────
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
