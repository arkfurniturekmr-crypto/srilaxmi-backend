/**
 * Application entry point.
 * Sets up security middleware, CORS, logging, the quotation API route,
 * static serving of generated PDFs, and centralised error handling.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const config = require("./config/env");
const quotationRoutes = require("./routes/quotationRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Make sure the storage root exists before the server starts accepting requests
if (!fs.existsSync(config.storageDir)) {
  fs.mkdirSync(config.storageDir, { recursive: true });
}

const app = express();

// --- Security & parsing middleware -----------------------------------
app.use(
  helmet({
    // Allow the PDF files served under /quotations to be embedded/opened
    // cross-origin (e.g. opened directly from the website)
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.isProduction ? "combined" : "dev"));

// --- Health check -------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- API routes -----------------------------------------------------------
app.use("/api", quotationRoutes);

// --- Static file serving for generated quotation PDFs ----------------------
// e.g. GET /quotations/2026-08-04/SL-20260804-4F9B21.pdf
app.use("/quotations", express.static(config.storageDir));

// --- 404 + centralised error handling --------------------------------------
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Sri Laxmi Timber backend running on port ${config.port} (${config.nodeEnv})`);
  // eslint-disable-next-line no-console
  console.log(`[server] Storage directory: ${config.storageDir}`);
  // eslint-disable-next-line no-console
  console.log(`[server] Allowed CORS origins: ${config.corsOrigins.join(", ")}`);
});
