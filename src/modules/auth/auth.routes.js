import { Router } from "express";
import {
  sendRegisterOTP,
  verifyRegisterOTP,
  savePersonalInfo,
  saveGamingProfile,
  sendLoginOTP,
  verifyLoginOTP,
  resendOTP,
  getProfile,
  updateProfile,
  getAllProfiles
} from "./auth.controller.js";

const router = Router();

// ── Register (5 steps) ────────────────────────────────────────────────────────
router.post("/register/send-otp", sendRegisterOTP); // Step 1: Account
router.post("/register/verify-otp", verifyRegisterOTP); // Step 2: Verify
router.post("/register/personal-info", savePersonalInfo); // Step 3: Personal
router.post("/register/gaming-profile", saveGamingProfile); // Step 4: Gaming

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login/send-otp", sendLoginOTP);
router.post("/login/verify-otp", verifyLoginOTP);

// ── Resend OTP ────────────────────────────────────────────────────────────────
router.post("/resend-otp", resendOTP);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/profile/:identifier", getProfile);         // GET by id or username
router.put("/profile/:userId",   updateProfile); 
router.get("/profiles", getAllProfiles);

export default router;
