import express from "express";
import {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  updateEventController,
  updateEventStatusController,
  deleteEventController,
  createSignupController,
  getAllSignupsController,
  getSignupsByEventController,
  getSignupByIdController,
  deleteSignupController,
} from "./event.controller.js";

const router = express.Router();

// POST   /api/events              → Create event
router.post("/create", createEventController);

// GET    /api/events              → Get all events (optional: ?status= &organizer= &venue=)
router.get("/", getAllEventsController);

// GET    /api/events/:id          → Get single event
router.get("/:id", getEventByIdController);

// PUT    /api/events/:id          → Full / partial update
router.put("/:id", updateEventController);

// PATCH  /api/events/:id/status   → Status change only
router.patch("/:id/status", updateEventStatusController);

// DELETE /api/events/:id          → Delete event
router.delete("/:id", deleteEventController);

// POST   /api/signups                        → Register for an event
router.post("/signup", createSignupController);
 
// GET    /api/signups                        → All signups (admin) — ?event_id= &game_name= &name=
router.get("/signup/all", getAllSignupsController);
 
// GET    /api/signups/event/:event_id        → All signups for a specific event
router.get("/signup/:event_id", getSignupsByEventController);
 
// GET    /api/signups/:id                    → Single signup by ID
router.get("/signup/:id", getSignupByIdController);
 
// DELETE /api/signups/:id                    → Remove a signup (admin)
router.delete("/signup/:id", deleteSignupController);

export default router;
