import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  // No keyFilename — uses App Engine ADC automatically
});

export const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
