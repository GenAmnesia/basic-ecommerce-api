const validationError = require('../utils/validationError');

function validateBody(schema) {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
    };
    const { error } = schema.validate(req.body, validationOptions);

    if (error) {
      throw validationError(error);
    }

    return next();
  };
}

module.exports = validateBody;
