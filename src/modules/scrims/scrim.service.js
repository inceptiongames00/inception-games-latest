import pool from "../../database/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SCRIM
// POST /api/v1/scrims
// body: { title, game, game_mode?, platform?, region?, hosted_by?,
//         max_teams?, team_size?, scheduled_at, rules?, banner_image? }
// ─────────────────────────────────────────────────────────────────────────────
export const createScrimService = async (data) => {
  const {
    title,
    game,
    game_mode,
    platform,
    region,
    hosted_by,
    max_teams = 12,
    team_size = 4,
    scheduled_at,
    rules,
    banner_image,
  } = data;

  if (!title) throw { status: 400, message: "Title is required" };
  if (!game) throw { status: 400, message: "Game is required" };
  if (!scheduled_at)
    throw { status: 400, message: "Scheduled date/time is required" };

  const [result] = await pool.query(
    `INSERT INTO scrims
       (title, game, game_mode, platform, region, hosted_by,
        max_teams, team_size, scheduled_at, rules, banner_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      game,
      game_mode || null,
      platform || null,
      region || null,
      hosted_by || null,
      max_teams,
      team_size,
      scheduled_at,
      rules || null,
      banner_image || null,
    ],
  );

  const [rows] = await pool.query("SELECT * FROM scrims WHERE id = ?", [
    result.insertId,
  ]);

  return { message: "Scrim created successfully!", scrim: rows[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL SCRIMS
// GET /api/v1/scrims?status=&game=&platform=&page=&limit=
// ─────────────────────────────────────────────────────────────────────────────
export const getAllScrimsService = async ({
  status,
  game,
  platform,
  page = 1,
  limit = 10,
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
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM scrims ${WHERE}`,
    params,
  );

  const [scrims] = await pool.query(
    `SELECT * FROM scrims ${WHERE}
     ORDER BY scheduled_at ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
  );

  return {
    total: Number(total),
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / limit),
    scrims,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE SCRIM
// GET /api/v1/scrims/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimByIdService = async (scrimId) => {
  const [rows] = await pool.query("SELECT * FROM scrims WHERE id = ?", [
    scrimId,
  ]);
  if (rows.length === 0) throw { status: 404, message: "Scrim not found" };

  // approved team count
  const [[{ approved_teams }]] = await pool.query(
    `SELECT COUNT(*) AS approved_teams FROM scrim_teams
     WHERE scrim_id = ? AND status = 'Approved'`,
    [scrimId],
  );

  return { scrim: { ...rows[0], approved_teams } };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE SCRIM
// PUT /api/v1/scrims/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateScrimService = async (scrimId, data) => {
  const [existing] = await pool.query("SELECT id FROM scrims WHERE id = ?", [
    scrimId,
  ]);
  if (existing.length === 0) throw { status: 404, message: "Scrim not found" };

  const allowed = [
    "title",
    "game",
    "game_mode",
    "platform",
    "region",
    "hosted_by",
    "max_teams",
    "team_size",
    "room_id",
    "room_password",
    "status",
    "scheduled_at",
    "rules",
    "banner_image",
  ];

  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0)
    throw { status: 400, message: "No valid fields provided to update" };

  values.push(scrimId);
  await pool.query(
    `UPDATE scrims SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  const [updated] = await pool.query("SELECT * FROM scrims WHERE id = ?", [
    scrimId,
  ]);

  return { message: "Scrim updated successfully!", scrim: updated[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE SCRIM
// DELETE /api/v1/scrims/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteScrimService = async (scrimId) => {
  const [existing] = await pool.query("SELECT id FROM scrims WHERE id = ?", [
    scrimId,
  ]);
  if (existing.length === 0) throw { status: 404, message: "Scrim not found" };

  await pool.query("DELETE FROM scrims WHERE id = ?", [scrimId]);

  return { message: "Scrim deleted successfully" };
};

// ─────────────────────────────────────────────────────────────────────────────
// TEAM REQUESTS TO JOIN SCRIM
// POST /api/v1/scrims/:id/request
// body: { team_name, contact_name, contact_email, contact_phone?,
//         discord_server?, in_game_name? }
// ─────────────────────────────────────────────────────────────────────────────
export const requestJoinScrimService = async (scrimId, data) => {
  const {
    team_name,
    contact_name,
    contact_email,
    contact_phone,
    discord_server,
    in_game_name,
  } = data;

  if (!team_name) throw { status: 400, message: "Team name is required" };
  if (!contact_name) throw { status: 400, message: "Contact name is required" };
  if (!contact_email)
    throw { status: 400, message: "Contact email is required" };

  // ── Check scrim exists and is open ─────────────────────────
  const [scrimRows] = await pool.query(
    "SELECT id, status, max_teams, filled_teams FROM scrims WHERE id = ?",
    [scrimId],
  );
  if (scrimRows.length === 0) throw { status: 404, message: "Scrim not found" };

  const scrim = scrimRows[0];

  if (scrim.status !== "Upcoming" && scrim.status !== "Active")
    throw { status: 400, message: "This scrim is not accepting team requests" };

  if (scrim.filled_teams >= scrim.max_teams)
    throw { status: 400, message: "Scrim is full — no team slots remaining" };

  // ── Duplicate email check ──────────────────────────────────
  const [dupEmail] = await pool.query(
    `SELECT id FROM scrim_teams
     WHERE scrim_id = ? AND contact_email = ?`,
    [scrimId, contact_email],
  );
  if (dupEmail.length > 0)
    throw {
      status: 409,
      message: "A team with this email has already requested to join",
    };

  // ── Insert team request ────────────────────────────────────
  const [result] = await pool.query(
    `INSERT INTO scrim_teams
       (scrim_id, team_name, contact_name, contact_email,
        contact_phone, discord_server, in_game_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      scrimId,
      team_name,
      contact_name,
      contact_email,
      contact_phone || null,
      discord_server || null,
      in_game_name || null,
    ],
  );

  const [rows] = await pool.query("SELECT * FROM scrim_teams WHERE id = ?", [
    result.insertId,
  ]);

  return {
    message: "Join request submitted! Waiting for host approval.",
    team: rows[0],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL TEAMS FOR A SCRIM
// GET /api/v1/scrims/:id/teams?status=
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimTeamsService = async (scrimId, { status } = {}) => {
  const [scrimRows] = await pool.query(
    "SELECT id, title, max_teams, filled_teams FROM scrims WHERE id = ?",
    [scrimId],
  );
  if (scrimRows.length === 0) throw { status: 404, message: "Scrim not found" };

  const conditions = ["scrim_id = ?"];
  const params = [scrimId];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  const [teams] = await pool.query(
    `SELECT * FROM scrim_teams
     WHERE ${conditions.join(" AND ")}
     ORDER BY requested_at ASC`,
    params,
  );

  // summary counts
  const [[summary]] = await pool.query(
    `SELECT
       COUNT(*)                         AS total,
       SUM(status = 'Pending')          AS pending,
       SUM(status = 'Approved')         AS approved,
       SUM(status = 'Rejected')         AS rejected,
       SUM(status = 'Disqualified')     AS disqualified
     FROM scrim_teams WHERE scrim_id = ?`,
    [scrimId],
  );

  return {
    scrim_id: Number(scrimId),
    scrim_title: scrimRows[0].title,
    summary,
    teams,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE TEAM
// GET /api/v1/scrims/:id/teams/:teamId
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimTeamByIdService = async (scrimId, teamId) => {
  const [rows] = await pool.query(
    `SELECT * FROM scrim_teams WHERE id = ? AND scrim_id = ?`,
    [teamId, scrimId],
  );
  if (rows.length === 0) throw { status: 404, message: "Team not found" };

  return { team: rows[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// APPROVE TEAM  (host/admin action)
// PATCH /api/v1/scrims/:id/teams/:teamId/approve
// body: { note? }
// ─────────────────────────────────────────────────────────────────────────────
export const approveTeamService = async (scrimId, teamId, { note } = {}) => {
  const [rows] = await pool.query(
    `SELECT id, status FROM scrim_teams WHERE id = ? AND scrim_id = ?`,
    [teamId, scrimId],
  );
  if (rows.length === 0) throw { status: 404, message: "Team not found" };

  if (rows[0].status === "Approved")
    throw { status: 400, message: "Team already approved" };

  // check slot availability
  const [scrimRows] = await pool.query(
    "SELECT max_teams, filled_teams FROM scrims WHERE id = ?",
    [scrimId],
  );
  if (scrimRows[0].filled_teams >= scrimRows[0].max_teams)
    throw { status: 400, message: "Scrim is full — cannot approve more teams" };

  await pool.query(
    `UPDATE scrim_teams SET status = 'Approved', note = ? WHERE id = ?`,
    [note || null, teamId],
  );

  await pool.query(
    `UPDATE scrims SET filled_teams = filled_teams + 1 WHERE id = ?`,
    [scrimId],
  );

  const [updated] = await pool.query("SELECT * FROM scrim_teams WHERE id = ?", [
    teamId,
  ]);

  return {
    message: "Team approved! They can now join the scrim.",
    team: updated[0],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// REJECT TEAM  (host/admin action)
// PATCH /api/v1/scrims/:id/teams/:teamId/reject
// body: { note? }
// ─────────────────────────────────────────────────────────────────────────────
export const rejectTeamService = async (scrimId, teamId, { note } = {}) => {
  const [rows] = await pool.query(
    `SELECT id, status FROM scrim_teams WHERE id = ? AND scrim_id = ?`,
    [teamId, scrimId],
  );
  if (rows.length === 0) throw { status: 404, message: "Team not found" };

  if (rows[0].status === "Rejected")
    throw { status: 400, message: "Team already rejected" };

  await pool.query(
    `UPDATE scrim_teams SET status = 'Rejected', note = ? WHERE id = ?`,
    [note || null, teamId],
  );

  // if team was previously approved, free the slot
  if (rows[0].status === "Approved") {
    await pool.query(
      `UPDATE scrims SET filled_teams = GREATEST(filled_teams - 1, 0) WHERE id = ?`,
      [scrimId],
    );
  }

  const [updated] = await pool.query("SELECT * FROM scrim_teams WHERE id = ?", [
    teamId,
  ]);

  return { message: "Team request rejected.", team: updated[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT RESULT  (host/admin — after scrim ends)
// POST /api/v1/scrims/:id/result
// body: [ { team_id, placement, kills, damage, points, notes? }, ... ]
// ─────────────────────────────────────────────────────────────────────────────
export const submitScrimResultService = async (scrimId, results) => {
  if (!Array.isArray(results) || results.length === 0)
    throw { status: 400, message: "results must be a non-empty array" };

  // verify scrim exists
  const [scrimRows] = await pool.query(
    "SELECT id, status FROM scrims WHERE id = ?",
    [scrimId],
  );
  if (scrimRows.length === 0) throw { status: 404, message: "Scrim not found" };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const entry of results) {
      const {
        team_id,
        placement,
        kills = 0,
        damage = 0,
        points = 0,
        notes,
      } = entry;

      if (!team_id)
        throw { status: 400, message: "Each result entry must have a team_id" };

      // verify team belongs to this scrim
      const [teamRows] = await conn.query(
        "SELECT id FROM scrim_teams WHERE id = ? AND scrim_id = ? AND status = 'Approved'",
        [team_id, scrimId],
      );
      if (teamRows.length === 0)
        throw {
          status: 404,
          message: `Team ${team_id} not found or not approved for this scrim`,
        };

      // upsert — replace if already submitted
      await conn.query(
        `INSERT INTO scrim_results (scrim_id, team_id, placement, kills, damage, points, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           placement = VALUES(placement),
           kills     = VALUES(kills),
           damage    = VALUES(damage),
           points    = VALUES(points),
           notes     = VALUES(notes),
           submitted_at = NOW()`,
        [
          scrimId,
          team_id,
          placement || null,
          kills,
          damage,
          points,
          notes || null,
        ],
      );
    }

    // mark scrim as Completed
    await conn.query(`UPDATE scrims SET status = 'Completed' WHERE id = ?`, [
      scrimId,
    ]);

    await conn.commit();
    conn.release();

    // return full standings ordered by points desc, placement asc
    const [standings] = await pool.query(
      `SELECT
         sr.placement, sr.kills, sr.damage, sr.points, sr.notes,
         st.team_name, st.in_game_name, st.contact_name
       FROM scrim_results sr
       JOIN scrim_teams st ON sr.team_id = st.id
       WHERE sr.scrim_id = ?
       ORDER BY sr.points DESC, sr.placement ASC`,
      [scrimId],
    );

    return {
      message: "Results submitted! Scrim marked as Completed.",
      standings,
    };
  } catch (e) {
    await conn.rollback();
    conn.release();
    throw e;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RESULTS / STANDINGS
// GET /api/v1/scrims/:id/result
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimResultService = async (scrimId) => {
  const [scrimRows] = await pool.query(
    "SELECT id, title, status FROM scrims WHERE id = ?",
    [scrimId],
  );
  if (scrimRows.length === 0) throw { status: 404, message: "Scrim not found" };

  const [standings] = await pool.query(
    `SELECT
       sr.placement, sr.kills, sr.damage, sr.points, sr.notes, sr.submitted_at,
       st.id AS team_id, st.team_name, st.in_game_name, st.contact_name
     FROM scrim_results sr
     JOIN scrim_teams st ON sr.team_id = st.id
     WHERE sr.scrim_id = ?
     ORDER BY sr.points DESC, sr.placement ASC`,
    [scrimId],
  );

  if (standings.length === 0)
    throw { status: 404, message: "No results submitted for this scrim yet" };

  return {
    scrim_id: Number(scrimId),
    scrim_title: scrimRows[0].title,
    status: scrimRows[0].status,
    standings,
  };
};
