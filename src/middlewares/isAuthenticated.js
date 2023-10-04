const customError = require('../utils/customError');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  throw customError(new Error('Authentication required to access this route'), 401);
}

module.exports = isAuthenticated;
