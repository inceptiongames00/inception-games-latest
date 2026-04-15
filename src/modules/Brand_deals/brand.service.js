import pool from "../../database/db.js";

const TIERS = {
  basic: { label: "Basic", price: 299 },
  premium: { label: "Premium", price: 499 },
};

const PLAYER_TYPES = ["Pro Player", "Streamer", "Rank Pusher", "Editor"];

export const checkEligibilityService = async (userId) => {
  // Pull all platform fields from users table
  const [users] = await pool.query(
    `SELECT id, email, phone, full_name, username, discord, bio,
            primary_game, game_role, \`rank\`, continent, country,
            avatar_url, banner_url, is_verified
     FROM users WHERE id = ?`,
    [userId],
  );
  if (users.length === 0)
    throw { status: 404, message: "User not found. Please sign in first." };

  const user = users[0];

  if (!user.is_verified)
    throw {
      status: 403,
      message: "Account must be verified before applying for a brand deal.",
    };

  // Check for existing active / pending deal
  const [existing] = await pool.query(
    `SELECT id, tier, tier_status FROM brand_deals
     WHERE user_id = ? AND tier_status IN ('pending', 'active')`,
    [userId],
  );

  return {
    eligible: existing.length === 0,
    user_profile: user,
    existing_deal: existing.length > 0 ? existing[0] : null,
    tiers: [
      {
        key: "basic",
        label: "Basic",
        price: 299,
        currency: "BDT",
        features: [
          "Profile badge",
          "Listed in brand directory",
          "1 brand match/month",
        ],
      },
      {
        key: "premium",
        label: "Premium",
        price: 499,
        currency: "BDT",
        features: [
          "Everything in Basic",
          "Priority brand matching",
          "3 brand matches/month",
          "Verified tag",
        ],
      },
    ],
  };
};

export const applyBrandDealService = async (data) => {
  const {
    user_id,
    logo_url,
    nid_full_name,
    ign,
    area,
    facebook_url,
    facebook_followers,
    youtube_url,
    youtube_followers,
    tiktok_url,
    tiktok_followers,
    instagram_url,
    instagram_followers,
    player_type,
    tier
  } = data;

  // Required field validation
  if (!user_id) throw { status: 400, message: "user_id is required" };
  if (!nid_full_name)
    throw { status: 400, message: "Full name as per NID is required" };
  if (!ign) throw { status: 400, message: "In-Game Name (IGN) is required" };
  if (!area) throw { status: 400, message: "Area of living is required" };
  if (!player_type) throw { status: 400, message: "Player type is required" };
  if (!tier)
    throw {
      status: 400,
      message: "Tier selection is required (basic or premium)",
    };

  // Validate enums 
  if (!PLAYER_TYPES.includes(player_type))
    throw {
      status: 400,
      message: `player_type must be one of: ${PLAYER_TYPES.join(", ")}`,
    };

  if (!TIERS[tier])
    throw {
      status: 400,
      message: "tier must be 'basic' (299 BDT) or 'premium' (499 BDT)",
    };

  const [users] = await pool.query(
    `SELECT id, email, phone, full_name, username, discord, bio,
            primary_game, game_role, \`rank\`, continent, country,
            avatar_url, banner_url
     FROM users WHERE id = ?`,
    [user_id],
  );
  if (users.length === 0) throw { status: 404, message: "User not found" };

  const [existing] = await pool.query(
    `SELECT id, tier_status FROM brand_deals
     WHERE user_id = ? AND tier_status IN ('pending', 'active')`,
    [user_id],
  );
  if (existing.length > 0)
    throw {
      status: 409,
      message: `You already have a ${existing[0].tier_status} brand deal application`,
    };
  const tierConfig = TIERS[tier];

  const [result] = await pool.query(
    `INSERT INTO brand_deals (
       user_id,
       logo_url, nid_full_name, ign,
       area,
       facebook_url, facebook_followers,
       youtube_url, youtube_followers,
       tiktok_url, tiktok_followers,
       instagram_url, instagram_followers,
       player_type,
       tier, tier_price, payment_note,
       payment_status, tier_status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
    [
      user_id,
      logo_url || null,
      nid_full_name,
      ign,
      area,
      facebook_url || "N/A",
      facebook_followers != null ? String(facebook_followers) : "N/A",
      youtube_url || "N/A",
      youtube_followers != null ? String(youtube_followers) : "N/A",
      tiktok_url || "N/A",
      tiktok_followers != null ? String(tiktok_followers) : "N/A",
      instagram_url || "N/A",
      instagram_followers != null ? String(instagram_followers) : "N/A",
      player_type,
      tierConfig.label.toLowerCase(),
      tierConfig.price,
      payment_note || null,
    ],
  );

  const [rows] = await pool.query("SELECT * FROM brand_deals WHERE id = ?", [
    result.insertId,
  ]);

  return {
    message:
      "Brand deal application submitted! please wait for verification.",
    brand_deal: rows[0],
    user_profile: users[0],
  };
};


export const getMyBrandDealService = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
       bd.*,
       u.email, u.phone, u.full_name, u.username, u.discord, u.bio,
       u.primary_game, u.game_role, u.rank, u.continent, u.country,
       u.avatar_url, u.banner_url
     FROM brand_deals bd
     JOIN users u ON bd.user_id = u.id
     WHERE bd.user_id = ?
     ORDER BY bd.applied_at DESC
     LIMIT 1`,
    [userId],
  );

  if (rows.length === 0)
    throw {
      status: 404,
      message: "No brand deal application found for this user",
    };

  return { brand_deal: rows[0] };
};

export const upgradeTierService = async (
  dealId,
  { trx_id, payment_method = "bKash" } = {},
) => {
  if (!trx_id)
    throw { status: 400, message: "Transaction ID is required for upgrade" };

  const [rows] = await pool.query(
    "SELECT id, tier, tier_status FROM brand_deals WHERE id = ?",
    [dealId],
  );
  if (rows.length === 0) throw { status: 404, message: "Brand deal not found" };

  if (rows[0].tier === "premium")
    throw { status: 400, message: "Already on premium tier" };

  if (rows[0].tier_status !== "active")
    throw { status: 400, message: "Only active brand deals can be upgraded" };

  const [dupTrx] = await pool.query(
    "SELECT id FROM brand_deals WHERE trx_id = ?",
    [trx_id],
  );
  if (dupTrx.length > 0)
    throw { status: 409, message: "This Transaction ID has already been used" };

  await pool.query(
    `UPDATE brand_deals
     SET tier = 'premium', tier_price = 499,
         trx_id = ?, payment_method = ?,
         payment_status = 'pending', tier_status = 'pending'
     WHERE id = ?`,
    [trx_id, payment_method, dealId],
  );

  const [updated] = await pool.query("SELECT * FROM brand_deals WHERE id = ?", [
    dealId,
  ]);

  return {
    message: "Upgrade to Premium submitted! Payment is being verified.",
    brand_deal: updated[0],
  };
};

export const getAllBrandDealsService = async ({
  tier_status,
  payment_status,
  tier,
  player_type,
  page = 1,
  limit = 10,
} = {}) => {
  const conditions = [];
  const params = [];

  if (tier_status) {
    conditions.push("bd.tier_status = ?");
    params.push(tier_status);
  }
  if (payment_status) {
    conditions.push("bd.payment_status = ?");
    params.push(payment_status);
  }
  if (tier) {
    conditions.push("bd.tier = ?");
    params.push(tier);
  }
  if (player_type) {
    conditions.push("bd.player_type = ?");
    params.push(player_type);
  }

  const WHERE = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM brand_deals bd ${WHERE}`,
    params,
  );

  const [deals] = await pool.query(
    `SELECT
       bd.*,
       u.email, u.full_name, u.username, u.phone,
       u.primary_game, u.country, u.avatar_url
     FROM brand_deals bd
     JOIN users u ON bd.user_id = u.id
     ${WHERE}
     ORDER BY bd.applied_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
  );

  const [[summary]] = await pool.query(
    `SELECT
       COUNT(*)                         AS total,
       SUM(tier_status = 'pending')     AS pending,
       SUM(tier_status = 'active')      AS active,
       SUM(tier_status = 'expired')     AS expired,
       SUM(tier_status = 'rejected')    AS rejected,
       SUM(payment_status = 'pending')  AS payment_pending,
       SUM(payment_status = 'verified') AS payment_verified,
       SUM(tier = 'basic')              AS basic_tier,
       SUM(tier = 'premium')            AS premium_tier
     FROM brand_deals`,
  );

  return {
    total: Number(total),
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / limit),
    summary,
    deals,
  };
};


export const getBrandDealByIdService = async (dealId) => {
  const [rows] = await pool.query(
    `SELECT
       bd.*,
       u.email, u.phone, u.full_name, u.username, u.discord, u.bio,
       u.primary_game, u.game_role, u.rank, u.continent, u.country,
       u.avatar_url, u.banner_url
     FROM brand_deals bd
     JOIN users u ON bd.user_id = u.id
     WHERE bd.id = ?`,
    [dealId],
  );

  if (rows.length === 0) throw { status: 404, message: "Brand deal not found" };

  return { brand_deal: rows[0] };
};


export const getPendingBrandDealsService = async () => {
  const [deals] = await pool.query(
    `SELECT
       bd.id, bd.user_id, bd.tier, bd.tier_price,
       bd.trx_id, bd.payment_method, bd.payment_note,
       bd.player_type, bd.applied_at,
       u.full_name, u.email, u.phone, u.username, u.avatar_url
     FROM brand_deals bd
     JOIN users u ON bd.user_id = u.id
     WHERE bd.payment_status = 'pending'
     ORDER BY bd.applied_at ASC`,
  );

  return { total_pending: deals.length, deals };
};


export const verifyBrandDealService = async (
  dealId,
  { verified_by, note } = {},
) => {
  const [rows] = await pool.query(
    "SELECT id, payment_status FROM brand_deals WHERE id = ?",
    [dealId],
  );
  if (rows.length === 0) throw { status: 404, message: "Brand deal not found" };

  if (rows[0].payment_status === "verified")
    throw { status: 400, message: "Payment already verified" };

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE brand_deals
     SET payment_status      = 'verified',
         payment_verified_at = NOW(),
         payment_verified_by = ?,
         payment_note        = ?,
         tier_status         = 'active',
         activated_at        = NOW(),
         expires_at          = ?
     WHERE id = ?`,
    [verified_by || "admin", note || null, expiresAt, dealId],
  );

  const [updated] = await pool.query("SELECT * FROM brand_deals WHERE id = ?", [
    dealId,
  ]);

  return {
    message: "Payment verified! Brand deal is now active for 30 days.",
    brand_deal: updated[0],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — REJECT PAYMENT
// PATCH /api/v1/brand-deals/:id/reject
// body: { verified_by?, note }
// ─────────────────────────────────────────────────────────────────────────────
export const rejectBrandDealService = async (
  dealId,
  { verified_by, note } = {},
) => {
  const [rows] = await pool.query(
    "SELECT id, payment_status FROM brand_deals WHERE id = ?",
    [dealId],
  );
  if (rows.length === 0) throw { status: 404, message: "Brand deal not found" };

  if (rows[0].payment_status === "rejected")
    throw { status: 400, message: "Payment already rejected" };

  await pool.query(
    `UPDATE brand_deals
     SET payment_status      = 'rejected',
         payment_verified_at = NOW(),
         payment_verified_by = ?,
         payment_note        = ?,
         tier_status         = 'rejected'
     WHERE id = ?`,
    [verified_by || "admin", note || null, dealId],
  );

  const [updated] = await pool.query("SELECT * FROM brand_deals WHERE id = ?", [
    dealId,
  ]);

  return {
    message: "Payment rejected. Brand deal application declined.",
    brand_deal: updated[0],
  };
};
