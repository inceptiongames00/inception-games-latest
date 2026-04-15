import {
  createTournamentService,
  getAllTournamentsService,
  getTournamentByIdService,
  updateTournamentService,
  updateBannerUrlService,
  deleteTournamentService,
  registerParticipantService,
  getParticipantsService,
} from "./tournaments.service";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TOURNAMENT
// POST /api/v1/tournaments
// ─────────────────────────────────────────────────────────────────────────────
export const createTournament = async (req, res, next) => {
  try {
    const result = await createTournamentService(req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL TOURNAMENTS
// GET /api/v1/tournaments?status=&game=&platform=&page=&limit=
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL TOURNAMENTS
// GET /api/v1/tournaments
// GET /api/v1/tournaments?status=Upcoming&game=Apex&platform=PC&page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTournaments = async (req, res, next) => {
  try {
    const {
      status,
      game,
      platform,
      page  = 1,
      limit = 10,
    } = req.query;

    const result = await getAllTournamentsService({
      status:   status   || null,
      game:     game     || null,
      platform: platform || null,
      page:     Number(page),
      limit:    Number(limit),
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE TOURNAMENT
// GET /api/v1/tournaments/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getTournamentById = async (req, res, next) => {
  try {
    const result = await getTournamentByIdService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TOURNAMENT
// PUT /api/v1/tournaments/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateTournament = async (req, res, next) => {
  try {
    const result = await updateTournamentService(req.params.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BANNER URL
// PATCH /api/v1/tournaments/:id/banner
// ─────────────────────────────────────────────────────────────────────────────
export const updateBannerUrl = async (req, res, next) => {
  try {
    const result = await updateBannerUrlService(
      req.params.id,
      req.body.banner_image,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE TOURNAMENT
// DELETE /api/v1/tournaments/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTournament = async (req, res, next) => {
  try {
    const result = await deleteTournamentService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER PARTICIPANT
// POST /api/v1/tournaments/:id/register
// ─────────────────────────────────────────────────────────────────────────────
export const registerParticipant = async (req, res, next) => {
  try {
    const result = await registerParticipantService(req.params.id, req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PARTICIPANTS
// GET /api/v1/tournaments/:id/participants
// ─────────────────────────────────────────────────────────────────────────────
export const getParticipants = async (req, res, next) => {
  try {
    const result = await getParticipantsService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
