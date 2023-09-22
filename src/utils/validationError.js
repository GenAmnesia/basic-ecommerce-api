function validationError(_error) {
  const error = _error;
  error.code = 'VALIDATION';
  error.status = 400;
  error.message = error.message ? error.message.replace(/"/g, "'") : 'Validation Error';
  if (process.env.NODE_ENV === 'dev') {
    Error.captureStackTrace(error);
    throw error;
  } else {
    const cleanedError = {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details.map((detail) => ({
        key: detail.context.key,
        type: detail.type,
        message: detail.message,
      })),
    };
    throw cleanedError;
  }
}

module.exports = validationError;
