import pool from "../../database/db.js";

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createEvent = async (eventData) => {
  const {
    title,
    organizer,
    venue,
    start_date,
    end_date,
    start_time,
    end_time,
    description,
    banner_url,
    registration_link,
    status,
  } = eventData;

  const [result] = await pool.execute(
    `INSERT INTO events 
      (title, organizer, venue, start_date, end_date, start_time, end_time,
       description, banner_url, registration_link, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      organizer,
      venue,
      start_date,
      end_date,
      start_time,
      end_time,
      description ?? null,
      banner_url ?? null,
      registration_link ?? null,
      status ?? "upcoming",
    ],
  );

  return { id: result.insertId, ...eventData };
};

// ─── READ ALL ─────────────────────────────────────────────────────────────────

export const getAllEvents = async (filters = {}) => {
  let query = "SELECT * FROM events WHERE 1=1";
  const params = [];

  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.organizer) {
    query += " AND organizer LIKE ?";
    params.push(`%${filters.organizer}%`);
  }

  if (filters.venue) {
    query += " AND venue LIKE ?";
    params.push(`%${filters.venue}%`);
  }

  query += " ORDER BY start_date ASC";

  const [rows] = await pool.execute(query, params);
  return rows;
};

// ─── READ ONE ─────────────────────────────────────────────────────────────────

export const getEventById = async (id) => {
  const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [id]);

  if (rows.length === 0) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  return rows[0];
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateEvent = async (id, updateData) => {
  await getEventById(id);

  const allowedFields = [
    "title",
    "organizer",
    "venue",
    "start_date",
    "end_date",
    "start_time",
    "end_time",
    "description",
    "banner_url",
    "registration_link",
    "status",
  ];

  const fields = [];
  const values = [];

  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  }

  if (fields.length === 0) {
    const err = new Error("No valid fields provided for update");
    err.statusCode = 400;
    throw err;
  }

  values.push(id);

  await pool.execute(
    `UPDATE events SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
    values,
  );

  return getEventById(id);
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteEvent = async (id) => {
  await getEventById(id);

  await pool.execute("DELETE FROM events WHERE id = ?", [id]);

  return { message: `Event with id ${id} deleted successfully` };
};

// ─── PATCH STATUS ─────────────────────────────────────────────────────────────

export const updateEventStatus = async (id, status) => {
  const validStatuses = ["upcoming", "ongoing", "completed", "cancelled"];

  if (!validStatuses.includes(status)) {
    const err = new Error(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    );
    err.statusCode = 400;
    throw err;
  }

  await getEventById(id);

  await pool.execute(
    "UPDATE events SET status = ?, updated_at = NOW() WHERE id = ?",
    [status, id],
  );

  return getEventById(id);
};

export const createSignup = async (signupData) => {
  const { event_id, name, phone, whatsapp, email, game_name, address } =
    signupData;

  // Check if event exists
  const [event] = await pool.execute(
    "SELECT id, status FROM events WHERE id = ?",
    [event_id],
  );

  if (event.length === 0) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  if (event[0].status === "completed" || event[0].status === "cancelled") {
    const err = new Error(`Registration is closed for this event`);
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate signup (same email per event)
  const [existing] = await pool.execute(
    "SELECT id FROM event_signups WHERE event_id = ? AND email = ?",
    [event_id, email],
  );

  if (existing.length > 0) {
    const err = new Error(
      "You have already registered for this event with this email",
    );
    err.statusCode = 409;
    throw err;
  }

  const [result] = await pool.execute(
    `INSERT INTO event_signups
      (event_id, name, phone, whatsapp, email, game_name, address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [event_id, name, phone, whatsapp ?? null, email, game_name, address],
  );

  return { id: result.insertId, ...signupData };
};

// ─── GET ALL SIGNUPS (admin) ──────────────────────────────────────────────────

export const getAllSignups = async (filters = {}) => {
  let query = `
    SELECT 
      s.id,
      s.name,
      s.phone,
      s.whatsapp,
      s.email,
      s.game_name,
      s.address,
      s.created_at,
      e.title  AS event_title,
      e.venue  AS event_venue,
      e.status AS event_status
    FROM event_signups s
    JOIN events e ON s.event_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.event_id) {
    query += " AND s.event_id = ?";
    params.push(filters.event_id);
  }

  if (filters.game_name) {
    query += " AND s.game_name LIKE ?";
    params.push(`%${filters.game_name}%`);
  }

  if (filters.name) {
    query += " AND s.name LIKE ?";
    params.push(`%${filters.name}%`);
  }

  query += " ORDER BY s.created_at DESC";

  const [rows] = await pool.execute(query, params);
  return rows;
};

// ─── GET SIGNUPS BY EVENT ─────────────────────────────────────────────────────

export const getSignupsByEvent = async (event_id) => {
  const [event] = await pool.execute("SELECT id FROM events WHERE id = ?", [
    event_id,
  ]);

  if (event.length === 0) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  const [rows] = await pool.execute(
    `SELECT 
      id, name, phone, whatsapp, email, game_name, address, created_at
     FROM event_signups
     WHERE event_id = ?
     ORDER BY created_at DESC`,
    [event_id],
  );

  return rows;
};

// ─── GET SINGLE SIGNUP ────────────────────────────────────────────────────────

export const getSignupById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.name,
      s.phone,
      s.whatsapp,
      s.email,
      s.game_name,
      s.address,
      s.created_at,
      e.title  AS event_title,
      e.venue  AS event_venue,
      e.start_date,
      e.end_date
     FROM event_signups s
     JOIN events e ON s.event_id = e.id
     WHERE s.id = ?`,
    [id],
  );

  if (rows.length === 0) {
    const err = new Error("Signup not found");
    err.statusCode = 404;
    throw err;
  }

  return rows[0];
};

// ─── DELETE SIGNUP ────────────────────────────────────────────────────────────

export const deleteSignup = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id FROM event_signups WHERE id = ?",
    [id],
  );

  if (rows.length === 0) {
    const err = new Error("Signup not found");
    err.statusCode = 404;
    throw err;
  }

  await pool.execute("DELETE FROM event_signups WHERE id = ?", [id]);

  return { message: `Signup with id ${id} deleted successfully` };
};
