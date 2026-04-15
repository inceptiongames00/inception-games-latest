import pool from "../../database/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────
export const createTournamentService = async (data) => {
  const {
    title,
    game,
    hosted_by,
    event_date,
    reg_start_at,
    reg_end_at,
    tournament_start_at,
    tournament_end_at,
  } = data;

  if (!title) throw { status: 400, message: "Title is required" };
  if (!game) throw { status: 400, message: "Game is required" };
  if (!hosted_by) throw { status: 400, message: "hosted_by is required" };
  if (!event_date) throw { status: 400, message: "event_date is required" };
  if (!reg_start_at) throw { status: 400, message: "reg_start_at is required" };
  if (!reg_end_at) throw { status: 400, message: "reg_end_at is required" };
  if (!tournament_start_at)
    throw { status: 400, message: "tournament_start_at is required" };
  if (!tournament_end_at)
    throw { status: 400, message: "tournament_end_at is required" };

  if (data.banner_image) {
    try {
      const url = new URL(data.banner_image);
      if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new Error();
    } catch {
      throw {
        status: 400,
        message: "banner_image must be a valid http/https URL",
      };
    }
  }

  const [result] = await pool.query(
    `INSERT INTO tournaments (
      title, game, game_mode, platform, region, location_type,
      map_link, hosted_by, prize_pool, reg_fee, currency, max_slots,
      banner_image, status, event_date, reg_start_at, reg_end_at,
      tournament_start_at, tournament_end_at, rules
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      game,
      data.game_mode || "Solo",
      data.platform || "PC",
      data.region || "Bangladesh",
      data.location_type || "Online",
      data.map_link || null,
      hosted_by,
      data.prize_pool || 0,
      data.reg_fee || 0, // ← registration fee
      data.currency || "BDT",
      data.max_slots || 64,
      data.banner_image || null,
      data.status || "Upcoming",
      event_date,
      reg_start_at,
      reg_end_at,
      tournament_start_at,
      tournament_end_at,
      data.rules || null,
    ],
  );

  const [rows] = await pool.query(
    `SELECT t.*, (t.max_slots - t.filled_slots) AS remaining_slots,
            COUNT(p.id) AS registered_participants
     FROM tournaments t
     LEFT JOIN tournament_participants p
       ON p.tournament_id = t.id AND p.status != 'Disqualified'
     WHERE t.id = ?
     GROUP BY t.id`,
    [result.insertId],
  );

  return {
    message: "Tournament created successfully!",
    tournament: rows[0],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL TOURNAMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTournamentsService = async ({
  status,
  game,
  platform,
} = {}) => {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (game) {
    conditions.push("game LIKE ?");
    params.push(`%${game}%`);
  }
  if (platform) {
    conditions.push("platform = ?");
    params.push(platform);
  }

  const WHERE = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [tournaments] = await pool.query(
    `SELECT
       id, title, game, game_mode, platform, region, location_type,
       hosted_by, prize_pool, reg_fee, currency, max_slots, filled_slots,
       (max_slots - filled_slots) AS remaining_slots,
       banner_image, status, event_date, reg_start_at, reg_end_at,
       tournament_start_at, tournament_end_at, created_at
     FROM tournaments
     ${WHERE}
     ORDER BY event_date ASC`,
    params,
  );

  return {
    total: tournaments.length,
    tournaments,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getTournamentByIdService = async (id) => {
  const [rows] = await pool.query(
    `SELECT t.*, (t.max_slots - t.filled_slots) AS remaining_slots,
            COUNT(p.id) AS registered_participants
     FROM tournaments t
     LEFT JOIN tournament_participants p
       ON p.tournament_id = t.id AND p.status != 'Disqualified'
     WHERE t.id = ?
     GROUP BY t.id`,
    [id],
  );

  if (rows.length === 0) throw { status: 404, message: "Tournament not found" };
  return { tournament: rows[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────
export const updateTournamentService = async (id, updates) => {
  const [existing] = await pool.query(
    "SELECT id FROM tournaments WHERE id = ?",
    [id],
  );
  if (existing.length === 0)
    throw { status: 404, message: "Tournament not found" };

  if (updates.banner_image) {
    try {
      const url = new URL(updates.banner_image);
      if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new Error();
    } catch {
      throw {
        status: 400,
        message: "banner_image must be a valid http/https URL",
      };
    }
  }

  const allowed = [
    "title",
    "game",
    "game_mode",
    "platform",
    "region",
    "location_type",
    "map_link",
    "hosted_by",
    "prize_pool",
    "reg_fee",
    "currency",
    "max_slots", // ← reg_fee added
    "banner_image",
    "status",
    "event_date",
    "reg_start_at",
    "reg_end_at",
    "tournament_start_at",
    "tournament_end_at",
    "rules",
  ];

  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0)
    throw { status: 400, message: "No valid fields provided to update" };

  values.push(id);
  await pool.query(
    `UPDATE tournaments SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  const [rows] = await pool.query(
    `SELECT t.*, (t.max_slots - t.filled_slots) AS remaining_slots,
            COUNT(p.id) AS registered_participants
     FROM tournaments t
     LEFT JOIN tournament_participants p
       ON p.tournament_id = t.id AND p.status != 'Disqualified'
     WHERE t.id = ?
     GROUP BY t.id`,
    [id],
  );

  return { message: "Tournament updated successfully!", tournament: rows[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BANNER URL
// ─────────────────────────────────────────────────────────────────────────────
export const updateBannerUrlService = async (id, banner_image) => {
  if (!banner_image)
    throw { status: 400, message: "banner_image URL is required" };

  try {
    const url = new URL(banner_image);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error();
  } catch {
    throw {
      status: 400,
      message: "banner_image must be a valid http/https URL",
    };
  }

  const [existing] = await pool.query(
    "SELECT id FROM tournaments WHERE id = ?",
    [id],
  );
  if (existing.length === 0)
    throw { status: 404, message: "Tournament not found" };

  await pool.query("UPDATE tournaments SET banner_image = ? WHERE id = ?", [
    banner_image,
    id,
  ]);

  return { message: "Banner URL updated successfully!", banner_image };
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTournamentService = async (id) => {
  const [existing] = await pool.query(
    "SELECT id FROM tournaments WHERE id = ?",
    [id],
  );
  if (existing.length === 0)
    throw { status: 404, message: "Tournament not found" };

  await pool.query("DELETE FROM tournaments WHERE id = ?", [id]);

  return { message: `Tournament #${id} deleted successfully` };
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER PARTICIPANT  (kept for backward compat — simple version)
// ─────────────────────────────────────────────────────────────────────────────
export const registerParticipantService = async (
  tournamentId,
  { user_name, user_email, game_username },
) => {
  if (!user_name) throw { status: 400, message: "user_name is required" };
  if (!user_email) throw { status: 400, message: "user_email is required" };
  if (!game_username)
    throw { status: 400, message: "game_username is required" };

  const [tournamentRows] = await pool.query(
    `SELECT id, status, filled_slots, max_slots FROM tournaments WHERE id = ?`,
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

  if (tournament.filled_slots >= tournament.max_slots)
    throw { status: 400, message: "Tournament is full — no slots remaining" };

  const [dupRows] = await pool.query(
    "SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_email = ?",
    [tournamentId, user_email],
  );
  if (dupRows.length > 0)
    throw { status: 409, message: "This email is already registered" };

  const conn = await new Promise((resolve, reject) =>
    pool.getConnection((err, c) => (err ? reject(err) : resolve(c))),
  );

  try {
    await new Promise((res, rej) =>
      conn.beginTransaction((e) => (e ? rej(e) : res())),
    );

    await new Promise((res, rej) =>
      conn.query(
        `INSERT INTO tournament_participants (tournament_id, user_name, user_email, game_username)
         VALUES (?, ?, ?, ?)`,
        [tournamentId, user_name, user_email, game_username],
        (e) => (e ? rej(e) : res()),
      ),
    );

    await new Promise((res, rej) =>
      conn.query(
        "UPDATE tournaments SET filled_slots = filled_slots + 1 WHERE id = ?",
        [tournamentId],
        (e) => (e ? rej(e) : res()),
      ),
    );

    await new Promise((res, rej) => conn.commit((e) => (e ? rej(e) : res())));
    conn.release();
  } catch (e) {
    await new Promise((res) => conn.rollback(res));
    conn.release();
    throw e;
  }

  return {
    message:
      "Registration successful! You are now registered for this tournament.",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PARTICIPANTS
// ─────────────────────────────────────────────────────────────────────────────
export const getParticipantsService = async (tournamentId) => {
  const [existing] = await pool.query(
    "SELECT id, title FROM tournaments WHERE id = ?",
    [tournamentId],
  );
  if (existing.length === 0)
    throw { status: 404, message: "Tournament not found" };

  const [participants] = await pool.query(
    `SELECT id, user_name, user_email, game_username, status, registered_at
     FROM tournament_participants
     WHERE tournament_id = ?
     ORDER BY registered_at ASC`,
    [tournamentId],
  );

  return {
    tournament_id: Number(tournamentId),
    tournament_title: existing[0].title,
    total: participants.length,
    participants,
  };
};
