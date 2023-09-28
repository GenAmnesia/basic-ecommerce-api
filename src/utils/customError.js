function customError(_error, _status, _code) {
  const error = _error;
  error.code = _code || error.code;
  error.status = _status || error.status || 500;
  if (process.env.NODE_ENV === 'dev') {
    return error;
  }
  const cleanedError = new Error(error.message);
  cleanedError.code = error.code;
  cleanedError.status = error.status;
  return cleanedError;
}

module.exports = customError;
