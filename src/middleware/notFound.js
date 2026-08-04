"use strict";

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `No route found for ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;
