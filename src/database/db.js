import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const db = isProduction
  ? {
      // App Engine - Unix socket
      socketPath:
        "/cloudsql/inception-games:asia-northeast1:inception-studio-db",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    }
  : {
      // Local dev - Public IP
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

export const pool = mysql.createPool(db);

export const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(
      `✅ DB Connected (${isProduction ? "Cloud SQL Socket" : "Public IP"})`,
    );
    connection.release();
  } catch (error) {
    console.error("❌ DB Connection failed:", error.message);
    process.exit(1);
  }
};

export default pool;
