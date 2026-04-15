import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./database/db";

const PORT =  process.env.PORT || 8080;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  try {
    console.log("⏳ Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
};

startServer();
