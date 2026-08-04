/**
 * Validates the JSON body sent by the frontend's buildQuotationObject().
 * Deliberately dependency-free (no Joi/Zod) to keep the backend lean —
 * swap this out for a schema library later if the payload grows.
 *
 * Expected shape:
 * {
 *   customer: { name, mobile, village, state },
 *   categories: [
 *     {
 *       key, name,
 *       rows: [{ sNo, pieces, lengthFt, widthIn, girthIn, cft }, ...],
 *       totals: { pieces, cft }
 *     }, ...
 *   ],
 *   grandTotals: { pieces, cft }
 * }
 */
"use strict";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateCustomer(customer, errors) {
  if (!customer || typeof customer !== "object") {
    errors.push("customer: is required and must be an object.");
    return;
  }
  if (!isNonEmptyString(customer.name)) errors.push("customer.name: is required.");
  if (!isNonEmptyString(customer.mobile) || customer.mobile.replace(/\D/g, "").length < 10) {
    errors.push("customer.mobile: is required and must contain at least 10 digits.");
  }
  if (!isNonEmptyString(customer.village)) errors.push("customer.village: is required.");
  if (!isNonEmptyString(customer.state)) errors.push("customer.state: is required.");
}

function validateRow(row, categoryIndex, rowIndex, errors) {
  const prefix = `categories[${categoryIndex}].rows[${rowIndex}]`;
  if (!row || typeof row !== "object") {
    errors.push(`${prefix}: must be an object.`);
    return;
  }
  if (typeof row.sNo !== "number") errors.push(`${prefix}.sNo: must be a number.`);
  if (!isFiniteNumber(row.pieces)) errors.push(`${prefix}.pieces: must be a number >= 0.`);
  if (!isFiniteNumber(row.lengthFt)) errors.push(`${prefix}.lengthFt: must be a number >= 0.`);
  if (!isFiniteNumber(row.widthIn)) errors.push(`${prefix}.widthIn: must be a number >= 0.`);
  if (!isFiniteNumber(row.girthIn)) errors.push(`${prefix}.girthIn: must be a number >= 0.`);
  if (!isFiniteNumber(row.cft)) errors.push(`${prefix}.cft: must be a number >= 0.`);
}

function validateTotals(totals, label, errors) {
  if (!totals || typeof totals !== "object") {
    errors.push(`${label}: is required and must be an object.`);
    return;
  }
  if (!isFiniteNumber(totals.pieces)) errors.push(`${label}.pieces: must be a number >= 0.`);
  if (!isFiniteNumber(totals.cft)) errors.push(`${label}.cft: must be a number >= 0.`);
}

function validateCategories(categories, errors) {
  if (!Array.isArray(categories) || categories.length === 0) {
    errors.push("categories: is required and must be a non-empty array.");
    return;
  }

  categories.forEach((cat, i) => {
    if (!cat || typeof cat !== "object") {
      errors.push(`categories[${i}]: must be an object.`);
      return;
    }
    if (!isNonEmptyString(cat.key)) errors.push(`categories[${i}].key: is required.`);
    if (!isNonEmptyString(cat.name)) errors.push(`categories[${i}].name: is required.`);

    if (!Array.isArray(cat.rows) || cat.rows.length === 0) {
      errors.push(`categories[${i}].rows: must be a non-empty array.`);
    } else {
      cat.rows.forEach((row, j) => validateRow(row, i, j, errors));
    }

    validateTotals(cat.totals, `categories[${i}].totals`, errors);
  });
}

/**
 * @param {object} body - raw request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateQuotationPayload(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }

  validateCustomer(body.customer, errors);
  validateCategories(body.categories, errors);
  validateTotals(body.grandTotals, "grandTotals", errors);

  return { valid: errors.length === 0, errors };
}

module.exports = { validateQuotationPayload };
