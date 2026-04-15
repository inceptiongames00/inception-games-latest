import {
  createScrimService,
  getAllScrimsService,
  getScrimByIdService,
  updateScrimService,
  deleteScrimService,
  requestJoinScrimService,
  getScrimTeamsService,
  getScrimTeamByIdService,
  approveTeamService,
  rejectTeamService,
  submitScrimResultService,
  getScrimResultService,
} from "./scrim.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SCRIM
// POST /api/v1/scrims
// ─────────────────────────────────────────────────────────────────────────────
export const createScrim = async (req, res, next) => {
try {
  let bannerUrl = null;

  // ✅ check if banner file exists
  if (req.files?.banner?.[0]) {
    bannerUrl = await uploadToGCP(req.files.banner[0], "scrims");
  }

  const result = await createScrimService({
    ...req.body,
    banner_image: bannerUrl, // 👈 pass uploaded URL
  });

  res.status(201).json(result);
} catch (error) {
  next(error);
}
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL SCRIMS
// GET /api/v1/scrims?status=&game=&platform=&page=&limit=
// ─────────────────────────────────────────────────────────────────────────────
export const getAllScrims = async (req, res, next) => {
  try {
    const result = await getAllScrimsService(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE SCRIM
// GET /api/v1/scrims/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimById = async (req, res, next) => {
  try {
    const result = await getScrimByIdService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE SCRIM
// PUT /api/v1/scrims/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateScrim = async (req, res, next) => {
  try {
    const result = await updateScrimService(req.params.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE SCRIM
// DELETE /api/v1/scrims/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteScrim = async (req, res, next) => {
  try {
    const result = await deleteScrimService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEAM REQUESTS TO JOIN
// POST /api/v1/scrims/:id/request
// ─────────────────────────────────────────────────────────────────────────────
export const requestJoinScrim = async (req, res, next) => {
  try {
    const result = await requestJoinScrimService(req.params.id, req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL TEAMS
// GET /api/v1/scrims/:id/teams?status=
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimTeams = async (req, res, next) => {
  try {
    const result = await getScrimTeamsService(req.params.id, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE TEAM
// GET /api/v1/scrims/:id/teams/:teamId
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimTeamById = async (req, res, next) => {
  try {
    const result = await getScrimTeamByIdService(
      req.params.id,
      req.params.teamId,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// APPROVE TEAM
// PATCH /api/v1/scrims/:id/teams/:teamId/approve
// ─────────────────────────────────────────────────────────────────────────────
export const approveTeam = async (req, res, next) => {
  try {
    const result = await approveTeamService(
      req.params.id,
      req.params.teamId,
      req.body,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REJECT TEAM
// PATCH /api/v1/scrims/:id/teams/:teamId/reject
// ─────────────────────────────────────────────────────────────────────────────
export const rejectTeam = async (req, res, next) => {
  try {
    const result = await rejectTeamService(
      req.params.id,
      req.params.teamId,
      req.body,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT RESULT
// POST /api/v1/scrims/:id/result
// ─────────────────────────────────────────────────────────────────────────────
export const submitScrimResult = async (req, res, next) => {
  try {
    const result = await submitScrimResultService(req.params.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RESULTS / STANDINGS
// GET /api/v1/scrims/:id/result
// ─────────────────────────────────────────────────────────────────────────────
export const getScrimResult = async (req, res, next) => {
  try {
    const result = await getScrimResultService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
