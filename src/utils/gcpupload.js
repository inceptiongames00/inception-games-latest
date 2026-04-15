import { bucket } from "../config/gcp.js";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = process.env.GCP_BUCKET_NAME;

// Upload and return permanent GCS URL
export const uploadToGCP = (file, folder) => {
  return new Promise((resolve, reject) => {
    const ext = file.originalname.split(".").pop();
    const filename = `${folder}/${uuidv4()}.${ext}`;
    const blob = bucket.file(filename);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on("error", reject);
    blobStream.on("finish", () => {
      // Permanent authenticated URL — no signature, no expiry
      const permanentUrl = `https://storage.cloud.google.com/${BUCKET_NAME}/${filename}`;
      resolve(permanentUrl);
    });

    blobStream.end(file.buffer);
  });
};
