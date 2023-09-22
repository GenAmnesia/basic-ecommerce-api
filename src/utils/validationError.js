function validationError(_error) {
  const error = _error;
  error.code = 'VALIDATION';
  error.status = 400;
  error.message = error.message ? error.message.replace(/"/g, "'") : 'Validation Error';
  if (process.env.NODE_ENV === 'dev') {
    Error.captureStackTrace(error);
    throw error;
  } else {
    const cleanedError = new Error(error.message);
    cleanedError.code = error.code;
    cleanedError.status = error.status;
    cleanedError.details = error.details.map((detail) => ({
      key: detail.context.key,
      type: detail.type,
      message: detail.message,
    }));

    return cleanedError;
  }
}

module.exports = validationError;
