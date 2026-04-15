import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  createSignup,
  getAllSignups,
  getSignupsByEvent,
  getSignupById,
  deleteSignup,
} from "./event.service.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

const handleError = (res, err) => {
  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

 
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9+\-\s]{7,15}$/.test(phone);


// ─── POST /api/events ─────────────────────────────────────────────────────────

export const createEventController = async (req, res) => {
  try {
    const {
      title,
      organizer,
      venue,
      start_date,
      end_date,
      start_time,
      end_time,
    } = req.body;

    if (
      !title ||
      !organizer ||
      !venue ||
      !start_date ||
      !end_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: title, organizer, venue, start_date, end_date, start_time, end_time",
      });
    }

    const event = await createEvent(req.body);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/events ──────────────────────────────────────────────────────────

export const getAllEventsController = async (req, res) => {
  try {
    const { status, organizer, venue } = req.query;
    const events = await getAllEvents({ status, organizer, venue });

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/events/:id ──────────────────────────────────────────────────────

export const getEventByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    const event = await getEventById(Number(id));

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────

export const updateEventController = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Request body is empty" });
    }

    const updatedEvent = await updateEvent(Number(id), req.body);

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── PATCH /api/events/:id/status ────────────────────────────────────────────

export const updateEventStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "status field is required" });
    }

    const updatedEvent = await updateEventStatus(Number(id), status);

    return res.status(200).json({
      success: true,
      message: "Event status updated",
      data: updatedEvent,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────

export const deleteEventController = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    const result = await deleteEvent(Number(id));

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const createSignupController = async (req, res) => {
  try {
    const { event_id, name, phone, email, game_name, address } = req.body;

    // Required field check
    if (!event_id || !name || !phone || !email || !game_name || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: event_id, name, phone, email, game_name, address",
      });
    }

    // Format validations
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    if (!isValidPhone(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number" });
    }

    const signup = await createSignup(req.body);

    return res.status(201).json({
      success: true,
      message: "Successfully registered for the event!",
      data: signup,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/signups ─────────────────────────────────────────────────────────

export const getAllSignupsController = async (req, res) => {
  try {
    const { event_id, game_name, name } = req.query;
    const signups = await getAllSignups({ event_id, game_name, name });

    return res.status(200).json({
      success: true,
      count: signups.length,
      data: signups,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/signups/event/:event_id ────────────────────────────────────────

export const getSignupsByEventController = async (req, res) => {
  try {
    const { event_id } = req.params;

    if (isNaN(event_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    const signups = await getSignupsByEvent(Number(event_id));

    return res.status(200).json({
      success: true,
      count: signups.length,
      data: signups,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/signups/:id ─────────────────────────────────────────────────────

export const getSignupByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signup ID" });
    }

    const signup = await getSignupById(Number(id));

    return res.status(200).json({
      success: true,
      data: signup,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── DELETE /api/signups/:id ──────────────────────────────────────────────────

export const deleteSignupController = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signup ID" });
    }

    const result = await deleteSignup(Number(id));

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return handleError(res, err);
  }
};
