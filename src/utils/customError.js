function customError(_error) {
  const error = _error;
  if (process.env.NODE_ENV === 'dev') {
    return error;
  }
  const cleanedError = new Error(error.message);
  cleanedError.code = error.code;
  cleanedError.status = error.status || 500;
  return cleanedError;
}

module.exports = customError;
