/**
 * Orchestrates turning a validated quotation payload into a stored PDF.
 * Keeps filesystem/path concerns here, separate from PDF rendering
 * (pdfService.js) and separate from HTTP concerns (controller).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config/env");
const { generateQuotationPdf } = require("./pdfService");
const { generateQuotationId, todayDateFolder } = require("../utils/idGenerator");

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * @param {object} payload - validated quotation payload from the frontend
 * @returns {Promise<{ quotationId: string, fileName: string, filePath: string, downloadUrl: string, pdfBase64: string, generatedAt: Date }>}
 */
async function createQuotation(payload) {
  const generatedAt = new Date();
  const quotationId = generateQuotationId(generatedAt);
  const dateFolder = todayDateFolder(generatedAt);

  const dirPath = path.join(config.storageDir, dateFolder);
  ensureDirExists(dirPath);

  const fileName = `${quotationId}.pdf`;
  const filePath = path.join(dirPath, fileName);

  await generateQuotationPdf(
    {
      quotationId,
      generatedAt,
      customer: payload.customer,
      categories: payload.categories,
      grandTotals: payload.grandTotals,
    },
    filePath
  );

  const downloadUrl = `${config.baseUrl}/quotations/${dateFolder}/${fileName}`;

  // NOTE: free-tier hosts (e.g. Render's free plan) use ephemeral disk —
  // a file written here can disappear on the next restart, sometimes
  // within seconds. So the PDF bytes are also returned directly in the
  // response (base64) — the customer's download never depends on this
  // file still existing later. `downloadUrl`/`filePath` are kept for
  // record-keeping and for the upcoming WhatsApp-send stage, on a best-
  // effort basis.
  const pdfBase64 = fs.readFileSync(filePath).toString("base64");

  return { quotationId, fileName, filePath, downloadUrl, pdfBase64, generatedAt };
}

module.exports = { createQuotation };
