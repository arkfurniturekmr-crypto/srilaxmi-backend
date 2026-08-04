/**
 * Centralised error handler. Every asyncHandler-wrapped route forwards
 * errors here via next(err), so error responses stay consistent and
 * stack traces never leak in production.
 */
"use strict";

const config = require("../config/env");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // eslint-disable-next-line no-console
  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);

  res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong while processing your request." : err.message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
