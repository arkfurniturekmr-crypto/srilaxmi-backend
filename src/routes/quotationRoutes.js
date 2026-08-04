"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { postQuotation } = require("../controllers/quotationController");

const router = express.Router();

// POST /api/quotation
router.post("/quotation", asyncHandler(postQuotation));

module.exports = router;
