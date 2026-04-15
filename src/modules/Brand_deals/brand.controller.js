import {
  checkEligibilityService,
  applyBrandDealService,
  getMyBrandDealService,
  upgradeTierService,
  getAllBrandDealsService,
  getBrandDealByIdService,
  getPendingBrandDealsService,
  verifyBrandDealService,
  rejectBrandDealService,
} from "./brand.service.js";

// ── Step 1 ─────────────────────────────────────────────────────────────────
// GET /api/v1/brand-deals/check-eligibility/:userId
export const checkEligibility = async (req, res, next) => {
  try {
    const result = await checkEligibilityService(req.params.userId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Steps 2+3+4 ────────────────────────────────────────────────────────────
// POST /api/v1/brand-deals/apply
export const applyBrandDeal = async (req, res, next) => {
  try {
    const result = await applyBrandDealService(req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Step 5 ─────────────────────────────────────────────────────────────────
// GET /api/v1/brand-deals/me/:userId
export const getMyBrandDeal = async (req, res, next) => {
  try {
    const result = await getMyBrandDealService(req.params.userId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── User action ────────────────────────────────────────────────────────────
// PATCH /api/v1/brand-deals/:id/upgrade
export const upgradeTier = async (req, res, next) => {
  try {
    const result = await upgradeTierService(req.params.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const getPendingBrandDeals = async (req, res, next) => {
  try {
    const result = await getPendingBrandDealsService();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getAllBrandDeals = async (req, res, next) => {
  try {
    const result = await getAllBrandDealsService(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getBrandDealById = async (req, res, next) => {
  try {
    const result = await getBrandDealByIdService(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const verifyBrandDeal = async (req, res, next) => {
  try {
    const result = await verifyBrandDealService(req.params.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const rejectBrandDeal = async (req, res, next) => {
  try {
    const result = await rejectBrandDealService(req.params.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
