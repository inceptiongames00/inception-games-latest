import {
  sendRegisterOTPService,
  verifyRegisterOTPService,
  savePersonalInfoService,
  saveGamingProfileService,
  sendLoginOTPService,
  verifyLoginOTPService,
  resendOTPService,
  updateProfileService,
  getProfileService,
  getAllProfilesService,
} from "./auth.service.js";
import { uploadProfileImages } from "../../middlewares/upload.middleware.js";


// Wrap async functions - catches errors and forwards to error middleware
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register/send-otp
// Step 1 → Account tab
// body: { email, phone? }
export const sendRegisterOTP = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const result = await sendRegisterOTPService(email, phone);
  res.status(200).json({ success: true, ...result });
});

// POST /api/v1/auth/register/verify-otp
// Step 2 → Verify tab
// body: { email, otp }
export const verifyRegisterOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await verifyRegisterOTPService(email, otp);
  res.status(200).json({ success: true, ...result });
});

// POST /api/v1/auth/register/personal-info
// Step 3 → Personal tab
// body: { email, full_name, username, discord?, bio? }
export const savePersonalInfo = asyncHandler(async (req, res) => {
  const { email, full_name, username, discord, bio } = req.body;
  const result = await savePersonalInfoService(email, {
    full_name,
    username,
    discord,
    bio,
  });
  res.status(200).json({ success: true, ...result });
});

// POST /api/v1/auth/register/gaming-profile
// Step 4 → Gaming tab
// body: { email, primary_game, game_role?, rank?, continent?, country? }
export const saveGamingProfile = asyncHandler(async (req, res) => {
  const { email, primary_game, game_role, rank, continent, country } = req.body;
  const result = await saveGamingProfileService(email, {
    primary_game,
    game_role,
    rank,
    continent,
    country,
  });
  res.status(200).json({ success: true, ...result });
});


export const updateProfile = [
  uploadProfileImages,

  async (req, res) => {
    try {
      const userId = req.params.userId; // keep consistent naming

      if (!userId) {
        return res.status(400).json({
          message: "userId is required in params",
        });
      }

      const result = await updateProfileService(userId, req.body, req.files);

      res.status(200).json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        message: err.message || "Internal server error",
      });
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/login/send-otp
// body: { email }
export const sendLoginOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await sendLoginOTPService(email);
  res.status(200).json({ success: true, ...result });
});

// POST /api/v1/auth/login/verify-otp
// body: { email, otp }
export const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await verifyLoginOTPService(email, otp);
  res.status(200).json({ success: true, ...result });
});

// ─────────────────────────────────────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/resend-otp
// body: { email, purpose }  purpose = 'register' | 'login'
export const resendOTP = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  const result = await resendOTPService(email, purpose);
  res.status(200).json({ success: true, ...result });
});


// ── Profile ───────────────────────────────────────────────────────────────────
 
// GET /api/v1/auth/profile/:identifier  (id or username)
export const getProfile = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  res.status(200).json({ success: true, ...(await getProfileService(identifier)) });
});
 



export const getAllProfiles = async (req, res) => {
  try {
    const { page, limit, game, continent, country, search } = req.query;
    const data = await getAllProfilesService({ page, limit, game, continent, country, search });
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};
 