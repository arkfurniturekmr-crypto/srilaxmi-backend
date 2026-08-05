/**
 * HTTP layer only — validates the request, delegates to the service layer,
 * shapes the response. No PDF or filesystem logic lives here.
 */
"use strict";

const { validateQuotationPayload } = require("../validators/quotationValidator");
const { createQuotation } = require("../services/quotationService");

async function postQuotation(req, res) {
  const { valid, errors } = validateQuotationPayload(req.body);

  if (!valid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed. Please check the submitted data.",
      errors,
    });
  }

  const result = await createQuotation(req.body);

  return res.status(201).json({
    success: true,
    message: "Quotation generated successfully.",
    quotationId: result.quotationId,
    fileName: result.fileName,
    downloadUrl: result.downloadUrl,
    pdfBase64: result.pdfBase64,
    generatedAt: result.generatedAt.toISOString(),
  });
}

module.exports = { postQuotation };
