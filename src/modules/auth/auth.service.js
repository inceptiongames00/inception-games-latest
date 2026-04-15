import bcrypt from "bcryptjs";
import pool from "../../database/db.js";
import sendEmail from "../../utils/sendEmail.js";
import { uploadToGCP } from "../../utils/gcpupload.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOTP = async (otp) => bcrypt.hash(otp, 10);

const otpEmailTemplate = (otp, action = "verify your email") => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;
              padding:32px;background:#1a1a2e;border-radius:12px;color:#fff;">
    <h2 style="color:#a855f7;margin-bottom:4px;">inception games</h2>
    <p style="color:#aaa;margin-top:0;">Your code to ${action}:</p>
    <div style="font-size:44px;font-weight:bold;letter-spacing:14px;
                color:#a855f7;margin:28px 0;text-align:center;">
      ${otp}
    </div>
    <p style="color:#aaa;font-size:13px;">
      Expires in <strong style="color:#fff;">10 minutes</strong>.
      Do not share this code with anyone.
    </p>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Send OTP  (Account tab)
// body: { email, phone? }
// ─────────────────────────────────────────────────────────────────────────────
export const sendRegisterOTPService = async (email, phone) => {
  if (!email) throw { status: 400, message: "Email is required" };

  // Check if already fully registered
  const [existing] = await pool.query(
    "SELECT id, reg_step FROM users WHERE email = ?",
    [email],
  );
  if (existing.length > 0 && existing[0].reg_step >= 5) {
    throw { status: 409, message: "Email already registered. Please sign in." };
  }
  const userId = await generateUserID();
  // Upsert user row with email + phone (reg_step = 1)
  if (existing.length === 0) {
    const userId = await generateUserID();
    await pool.query(
      "INSERT INTO users (id, email, phone, reg_step) VALUES (?, ?, ?, 1)",
      [userId, email, phone || null],
    );
  } else {
    await pool.query(
      "UPDATE users SET phone = ?, reg_step = 1 WHERE email = ?",
      [phone || null, email],
    );
  }

  // Delete old OTPs for this email
  await pool.query(
    "DELETE FROM otp_codes WHERE email = ? AND purpose = 'register'",
    [email],
  );

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await pool.query(
    `INSERT INTO otp_codes (email, otp_hash, purpose, expires_at)
     VALUES (?, ?, 'register', ?)`,
    [email, otpHash, expiresAt],
  );

  await sendEmail({
    to: email,
    subject: "Your inception games Verification Code",
    html: otpEmailTemplate(otp, "verify your email"),
  });

  return { message: "OTP sent to your email. Please check your inbox." };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Verify OTP  (Verify tab)
// body: { email, otp }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyRegisterOTPService = async (email, otp) => {
  if (!email || !otp)
    throw { status: 400, message: "Email and OTP are required" };

  const [rows] = await pool.query(
    `SELECT * FROM otp_codes
     WHERE email = ? AND purpose = 'register' AND used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [email],
  );

  if (rows.length === 0)
    throw { status: 400, message: "No OTP found. Please request a new one." };

  const record = rows[0];

  if (new Date() > new Date(record.expires_at))
    throw {
      status: 400,
      message: "OTP has expired. Please request a new one.",
    };

  if (record.attempts >= 5)
    throw {
      status: 400,
      message: "Too many failed attempts. Please request a new OTP.",
    };

  const isMatch = await bcrypt.compare(String(otp), record.otp_hash);

  if (!isMatch) {
    await pool.query(
      "UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?",
      [record.id],
    );
    const left = 5 - (record.attempts + 1);
    throw { status: 400, message: `Invalid OTP. ${left} attempts left.` };
  }

  // Mark OTP used + mark user email as verified
  await pool.query("UPDATE otp_codes SET used = 1 WHERE id = ?", [record.id]);
  await pool.query(
    "UPDATE users SET is_verified = 1, reg_step = 2 WHERE email = ?",
    [email],
  );

  return {
    message: "Email verified! Now set up your profile.",
    email,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Personal Info  (Personal tab)
// body: { email, full_name, username, discord?, bio? }
// ─────────────────────────────────────────────────────────────────────────────

const generateUserID = async () => {
  let unique = false;
  let userId;

  while (!unique) {
    const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    userId = `SNS-${num}`;

    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (existing.length === 0) unique = true;
  }

  return userId;
};
export const savePersonalInfoService = async (
  email,
  { full_name, username, discord, bio },
) => {
  if (!full_name) throw { status: 400, message: "Full name is required" };
  if (!username)
    throw { status: 400, message: "Gamer tag / username is required" };

  // Check user exists & is verified
  const [users] = await pool.query(
    "SELECT id, is_verified, reg_step FROM users WHERE email = ?",
    [email],
  );
  if (users.length === 0) throw { status: 404, message: "User not found" };
  if (!users[0].is_verified)
    throw {
      status: 403,
      message: "Email not verified. Complete step 2 first.",
    };

  // Check username not taken by another user
  const [taken] = await pool.query(
    "SELECT id FROM users WHERE username = ? AND email != ?",
    [username, email],
  );
  if (taken.length > 0)
    throw { status: 409, message: "Username already taken. Try another." };

  await pool.query(
    `UPDATE users
     SET full_name = ?, username = ?, discord = ?, bio = ?, reg_step = 3
     WHERE email = ?`,
    [full_name, username, discord || null, bio || null, email],
  );

  return {
    message: "Personal info saved!",
    userId: users[0].id,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Gaming Profile  (Gaming tab)
// body: { email, primary_game, game_role?, rank?, continent?, country? }
// ─────────────────────────────────────────────────────────────────────────────
export const saveGamingProfileService = async (
  email,
  { primary_game, game_role, rank, continent, country },
) => {
  if (!primary_game) throw { status: 400, message: "Primary game is required" };

  const [users] = await pool.query(
    "SELECT id, reg_step FROM users WHERE email = ?",
    [email],
  );
  if (users.length === 0) throw { status: 404, message: "User not found" };
  if (users[0].reg_step < 3)
    throw {
      status: 403,
      message: "Please complete personal info first (step 3).",
    };

  await pool.query(
    `UPDATE users
   SET primary_game = ?, game_role = ?, \`rank\` = ?,
       continent = ?, country = ?, reg_step = 4
   WHERE email = ?`,
    [
      primary_game,
      game_role || null,
      rank || null,
      continent || null,
      country || null,
      email,
    ],
  );

  return { message: "Gaming profile saved!" };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Profile Images  (Images tab)
// body: { email, avatar_url?, banner_url? }
// ─────────────────────────────────────────────────────────────────────────────
export const saveProfileImagesService = async (
  email,
  { avatar_url, banner_url },
) => {
  const [users] = await pool.query(
    "SELECT id, reg_step FROM users WHERE email = ?",
    [email],
  );
  if (users.length === 0) throw { status: 404, message: "User not found" };
  if (users[0].reg_step < 4)
    throw {
      status: 403,
      message: "Please complete gaming profile first (step 4).",
    };

  await pool.query(
    `UPDATE users
     SET avatar_url = ?, banner_url = ?, reg_step = 5
     WHERE email = ?`,
    [avatar_url || null, banner_url || null, email],
  );

  // Return full user profile
  const [result] = await pool.query(
    `SELECT id, email, phone, full_name, username, discord, bio,
          primary_game, game_role, \`rank\`, continent, country,
          avatar_url, banner_url, role, is_verified, reg_step
   FROM users WHERE email = ?`,
    [email],
  );

  return {
    message: "Registration complete! Welcome to inception games 🎮",
    user: result[0],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — Send OTP
// body: { email }
// ─────────────────────────────────────────────────────────────────────────────
export const sendLoginOTPService = async (email) => {
  if (!email) throw { status: 400, message: "Email is required" };

  const [rows] = await pool.query(
    "SELECT id, is_verified FROM users WHERE email = ?",
    [email],
  );
  if (rows.length === 0)
    throw { status: 404, message: "No account found with this email." };
  if (!rows[0].is_verified)
    throw { status: 403, message: "Account not verified." };

  await pool.query(
    "DELETE FROM otp_codes WHERE email = ? AND purpose = 'login'",
    [email],
  );

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (email, otp_hash, purpose, expires_at)
     VALUES (?, ?, 'login', ?)`,
    [email, otpHash, expiresAt],
  );

  await sendEmail({
    to: email,
    subject: "Your inception games Login Code",
    html: otpEmailTemplate(otp, "sign in"),
  });

  return { message: "Login OTP sent to your email." };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — Verify OTP & return user
// body: { email, otp }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyLoginOTPService = async (email, otp) => {
  if (!email || !otp)
    throw { status: 400, message: "Email and OTP are required" };

  const [rows] = await pool.query(
    `SELECT * FROM otp_codes
     WHERE email = ? AND purpose = 'login' AND used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [email],
  );

  if (rows.length === 0)
    throw { status: 400, message: "No OTP found. Please request a new one." };

  const record = rows[0];

  if (new Date() > new Date(record.expires_at))
    throw { status: 400, message: "OTP expired. Please request a new one." };

  if (record.attempts >= 5)
    throw { status: 400, message: "Too many attempts. Request a new OTP." };

  const isMatch = await bcrypt.compare(String(otp), record.otp_hash);

  if (!isMatch) {
    await pool.query(
      "UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?",
      [record.id],
    );
    throw { status: 400, message: "Invalid OTP. Please try again." };
  }

  await pool.query("UPDATE otp_codes SET used = 1 WHERE id = ?", [record.id]);

  const [users] = await pool.query(
    `SELECT id, email, phone, full_name, username, discord, bio,
            primary_game, game_role, \`rank\`, continent, country,
            avatar_url, banner_url, role, is_verified, reg_step
     FROM users WHERE email = ?`,
    [email],
  );

  return {
    message: "Login successful!",
    user: users[0],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEND OTP  (both register & login)
// body: { email, purpose }
// ─────────────────────────────────────────────────────────────────────────────
export const resendOTPService = async (email, purpose = "register") => {
  if (!email) throw { status: 400, message: "Email is required" };

  await pool.query("DELETE FROM otp_codes WHERE email = ? AND purpose = ?", [
    email,
    purpose,
  ]);

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (email, otp_hash, purpose, expires_at)
     VALUES (?, ?, ?, ?)`,
    [email, otpHash, purpose, expiresAt],
  );

  await sendEmail({
    to: email,
    subject: "Your New inception games OTP",
    html: otpEmailTemplate(
      otp,
      purpose === "login" ? "sign in" : "verify your email",
    ),
  });

  return { message: "New OTP sent to your email." };
};

 
// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE — by userId or username
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileService = async (identifier) => {
  const [rows] = await pool.query(
    `SELECT id, email, phone, full_name, username, discord, bio,
            primary_game, game_role, \`rank\`, continent, country,
            avatar_url, banner_url, role, is_verified,
            created_at
     FROM users WHERE id = ?`,
    [identifier],
  );

  if (rows.length === 0) throw { status: 404, message: "User not found" };
  return { user: rows[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE — matches your profile page fields
// ─────────────────────────────────────────────────────────────────────────────


export const updateProfileService = async (userId, updates, files = {}) => {
  const {
    full_name,
    username,
    discord,
    bio,
    phone,
    primary_game,
    game_role,
    rank,
    continent,
    country,
  } = updates;

  // Check user exists
  const [users] = await pool.query("SELECT id, email FROM users WHERE id = ?", [
    userId,
  ]);
  if (users.length === 0) throw { status: 404, message: "User not found" };

  // Check username not taken
  if (username) {
    const [taken] = await pool.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, userId],
    );
    if (taken.length > 0)
      throw { status: 409, message: "Username already taken. Try another." };
  }

  // Upload images to GCP if files were sent
  let avatar_url, banner_url;

  if (files.avatar?.[0]) {
    avatar_url = await uploadToGCP(files.avatar[0], "avatars");
  }
  if (files.banner?.[0]) {
    banner_url = await uploadToGCP(files.banner[0], "banners");
  }

  // Build dynamic SET clause
  const fields = [];
  const values = [];

  if (full_name !== undefined) {
    fields.push("full_name = ?");
    values.push(full_name);
  }
  if (username !== undefined) {
    fields.push("username = ?");
    values.push(username);
  }
  if (discord !== undefined) {
    fields.push("discord = ?");
    values.push(discord);
  }
  if (bio !== undefined) {
    fields.push("bio = ?");
    values.push(bio);
  }
  if (phone !== undefined) {
    fields.push("phone = ?");
    values.push(phone);
  }
  if (primary_game !== undefined) {
    fields.push("primary_game = ?");
    values.push(primary_game);
  }
  if (game_role !== undefined) {
    fields.push("game_role = ?");
    values.push(game_role);
  }
  if (rank !== undefined) {
    fields.push("`rank` = ?");
    values.push(rank);
  }
  if (continent !== undefined) {
    fields.push("continent = ?");
    values.push(continent);
  }
  if (country !== undefined) {
    fields.push("country = ?");
    values.push(country);
  }
  if (avatar_url !== undefined) {
    fields.push("avatar_url = ?");
    values.push(avatar_url);
  }
  if (banner_url !== undefined) {
    fields.push("banner_url = ?");
    values.push(banner_url);
  }

  if (fields.length === 0)
    throw { status: 400, message: "No fields provided to update" };

  values.push(userId);

  await pool.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  // Return updated profile
  const [result] = await pool.query(
    `SELECT id, email, phone, full_name, username, discord, bio,
            primary_game, game_role, \`rank\`, continent, country,
            avatar_url, banner_url, role, is_verified, created_at
     FROM users WHERE id = ?`,
    [userId],
  );

  return { message: "Profile updated successfully!", user: result[0] };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PROFILES — fully registered users only (reg_step = 5)
// query params: { page?, limit?, game?, continent?, country?, search? }
// ─────────────────────────────────────────────────────────────────────────────
export const getAllProfilesService = async ({
  page = 1,
  limit = 20,
  game,
  continent,
  country,
  search,
} = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // ── Build dynamic WHERE clause ──────────────────────────────────────────
  const conditions = ["reg_step >= 5", "is_verified = 1"];
  const values = [];

  if (game) {
    conditions.push("primary_game = ?");
    values.push(game);
  }

  if (continent) {
    conditions.push("continent = ?");
    values.push(continent);
  }

  if (country) {
    conditions.push("country = ?");
    values.push(country);
  }

  if (search) {
    conditions.push("(username LIKE ? OR full_name LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.join(" AND ");

  // ── Total count (for pagination meta) ──────────────────────────────────
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM users WHERE ${where}`,
    values
  );
  const total = countRows[0].total;

  // ── Fetch page ──────────────────────────────────────────────────────────
  const [rows] = await pool.query(
    `SELECT
       id, full_name, username, discord, bio,
       primary_game, game_role, \`rank\`,
       continent, country,
       avatar_url, banner_url,
       created_at
     FROM users
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, parseInt(limit), offset]
  );

  return {
    profiles: rows,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};