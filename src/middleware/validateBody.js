function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      error.code = 'VALIDATION';
      error.status = 400;
      if (process.env.DEBUG === 'true') {
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

    return next();
  };
}

module.exports = validateBody;
