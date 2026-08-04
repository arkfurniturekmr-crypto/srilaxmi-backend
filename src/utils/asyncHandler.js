/**
 * Wraps an async Express route handler so any rejected promise / thrown
 * error is automatically forwarded to next(), instead of needing a
 * try/catch block in every single controller.
 */
"use strict";

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
