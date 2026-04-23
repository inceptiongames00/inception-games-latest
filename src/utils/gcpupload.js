import { bucket } from "../config/gcp.js";
import { v4 as uuidv4 } from "uuid";

export const uploadToGCP = (file, folder) => {
  return new Promise((resolve, reject) => {
    const ext = file.originalname.split(".").pop();
    const filename = `${folder}/${uuidv4()}.${ext}`;
    const blob = bucket.file(filename);

    const stream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    stream.on("error", reject);

    stream.on("finish", () => {
      resolve(filename); // IMPORTANT: return file path only
    });

    stream.end(file.buffer);
  });
};
