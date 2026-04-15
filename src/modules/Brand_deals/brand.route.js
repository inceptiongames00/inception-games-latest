import { Router } from "express";
import {
  checkEligibility,
  applyBrandDeal,
  getMyBrandDeal,
  upgradeTier,
  getPendingBrandDeals,
  getAllBrandDeals,
  getBrandDealById,
  verifyBrandDeal,
  rejectBrandDeal,
} from "./brand.controller.js";

const router = Router();

// ── User routes (5-step flow) ─────────────────────────────────────────────

// Step 1 — auth/eligibility check
// GET  /api/v1/brand-deals/check-eligibility/:userId
router.get("/check-eligibility/:userId", checkEligibility);

// Steps 2+3+4 — full application in one call
// POST /api/v1/brand-deals/apply
router.post("/apply", applyBrandDeal);

// Step 5 — success screen + summary
// GET  /api/v1/brand-deals/me/:userId
router.get("/me/:userId", getMyBrandDeal);

// Upgrade tier basic → premium
// PATCH /api/v1/brand-deals/:id/upgrade
router.patch("/:id/upgrade", upgradeTier);

// ── Admin routes ──────────────────────────────────────────────────────────

// GET  /api/v1/brand-deals/pending     ← BEFORE /:id to avoid collision
router.get("/pending", getPendingBrandDeals);

// GET  /api/v1/brand-deals?filters
router.get("/", getAllBrandDeals);

// GET  /api/v1/brand-deals/:id
router.get("/:id", getBrandDealById);

// PATCH /api/v1/brand-deals/:id/verify
router.patch("/:id/verify", verifyBrandDeal);

// PATCH /api/v1/brand-deals/:id/reject
router.patch("/:id/reject", rejectBrandDeal);

export default router;
