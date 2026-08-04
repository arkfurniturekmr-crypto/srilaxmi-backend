/**
 * Centralised environment configuration.
 * Every other file reads config from here instead of touching
 * process.env directly — makes it trivial to see every setting the
 * app depends on, and to fail fast if something required is missing.
 */
"use strict";

const path = require("path");
require("dotenv").config();

const REQUIRED_VARS = ["PORT", "BASE_URL", "CORS_ORIGIN", "STORAGE_DIR"];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Fail fast and loudly rather than limping along with undefined config.
  // eslint-disable-next-line no-console
  console.error(
    `[config] Missing required environment variable(s): ${missing.join(", ")}.\n` +
      `Copy .env.example to .env and fill in real values.`
  );
  process.exit(1);
}

const config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  baseUrl: process.env.BASE_URL.replace(/\/+$/, ""), // strip trailing slash
  corsOrigins: process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR),
  companyLogoPath: path.resolve(process.cwd(), "assets", "company-logo.png"),
};

module.exports = config;
