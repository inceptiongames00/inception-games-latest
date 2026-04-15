import mysql from "mysql2/promise";
import config from "../config/env.js";

const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
});

await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``);
await conn.query(`USE \`${config.db.database}\``);

// users — no password column, OTP-only auth
await conn.query(`
  CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    avatar_url   VARCHAR(255),
    role         ENUM('user','admin') DEFAULT 'user',
    is_verified  TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

// otp_codes — stores hashed OTPs with expiry and rate-limit tracking
await conn.query(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(100) NOT NULL,
    otp_hash     VARCHAR(255) NOT NULL,
    purpose      ENUM('login','register') DEFAULT 'login',
    expires_at   DATETIME    NOT NULL,
    used         TINYINT(1)  DEFAULT 0,
    attempts     TINYINT     DEFAULT 0,
    created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(150) NOT NULL,
    game       VARCHAR(100) NOT NULL,
    prize_pool VARCHAR(50),
    start_date DATE,
    end_date   DATE,
    max_teams  INT DEFAULT 16,
    banner_url VARCHAR(255),
    status     ENUM('upcoming','ongoing','finished') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS tournament_registrations (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id  INT NOT NULL,
    user_id        INT NOT NULL,
    team_name      VARCHAR(100) NOT NULL,
    in_game_name   VARCHAR(100) NOT NULL,
    phone          VARCHAR(20),
    payment_method ENUM('bkash','sslcommerz','cash') DEFAULT 'bkash',
    payment_status ENUM('pending','paid','failed')   DEFAULT 'pending',
    registered_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    UNIQUE KEY uq_tournament_user (tournament_id, user_id)
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    event_date  DATETIME,
    location    VARCHAR(200),
    image_url   VARCHAR(255),
    status      ENUM('upcoming','finished') DEFAULT 'upcoming',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS event_registrations (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    event_id      INT NOT NULL,
    user_id       INT NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    UNIQUE KEY uq_event_user (event_id, user_id)
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS news (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    body         TEXT,
    category     VARCHAR(80)  DEFAULT 'E-sports',
    image_url    VARCHAR(255),
    external_url VARCHAR(255),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS jobs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    department  VARCHAR(100),
    location    VARCHAR(100) DEFAULT 'Dhaka, Bangladesh',
    type        ENUM('full-time','part-time','remote','internship') DEFAULT 'full-time',
    description TEXT,
    is_active   TINYINT(1) DEFAULT 1,
    posted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await conn.end();
console.log(
  "✅  All tables created successfully in database:",
  config.db.database,
);
console.log(
  "   Tables: users, otp_codes, tournaments, tournament_registrations,",
);
console.log(
  "           events, event_registrations, news, contact_messages, jobs",
);
