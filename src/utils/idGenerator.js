/**
 * Generates unique, human-readable quotation IDs and the date-based
 * folder structure used to organise stored PDFs.
 *
 * ID shape: SL-YYYYMMDD-XXXXXX  (e.g. SL-20260804-4F9B21)
 * This keeps IDs sortable by date and safe to use directly as filenames.
 */
"use strict";

const crypto = require("crypto");

/** e.g. 2026-08-04 */
function todayDateFolder(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** e.g. 20260804 */
function compactDate(date = new Date()) {
  return todayDateFolder(date).replace(/-/g, "");
}

function generateQuotationId(date = new Date()) {
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `SL-${compactDate(date)}-${randomPart}`;
}

module.exports = { generateQuotationId, todayDateFolder };
