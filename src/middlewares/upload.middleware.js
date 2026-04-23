import multer from "multer";
import { bucket } from "../config/gcp.js";

/**
 * =========================
 * MULTER CONFIG
 * =========================
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"), false);
    }
    cb(null, true);
  },
});

/**
 * =========================
 * MULTI FILE UPLOADS
 * =========================
 */
export const uploadProfileImages = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

export const uploadPaymentScreenshot = upload.single("screenshot");
export const uploadScrimImage = upload.single("banner");

/**
 * =========================
 * SIGNED URL GENERATOR
 * =========================
 */
export const getSignedUrl = async (filePath) => {
  // 🔥 SAFETY CHECK (IMPORTANT FIX)
  if (!filePath) return null;

  // ❌ Prevent full URL being passed accidentally
  if (filePath.startsWith("http")) {
    console.error("Invalid filePath passed to getSignedUrl:", filePath);
    throw new Error("filePath must NOT be a URL, only GCS object path");
  }

  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
};
