const Joi = require('joi');
const BaseModel = require('./BaseModel');
const customError = require('../utils/customError');

const userSchemaKeys = {
  id: Joi.number().integer()
    .alter({
      insert: (schema) => schema.forbidden(),
      update: (schema) => schema.forbidden(),
    }),
  first_name: Joi.string().min(2).max(255).allow(null),
  last_name: Joi.string().min(2).max(255).allow(null),
  email: Joi.string().email()
    .message('Invalid email provided')
    .alter({
      insert: (schema) => schema.required(),
      localLogin: (schema) => schema.required(),
    }),
  password: Joi.string().max(255).allow(null)
    .message('Passwords must have the following properties: - At least 3 characters. - At most 30 characters. - No symbols contained')
    .alter({
      insert: (schema) => schema.required(),
      localLogin: (schema) => schema.pattern(/^[a-zA-Z0-9]{3,30}$/).required(),
    }),
  google_id: Joi.string().max(255).allow(null),
  google_token: Joi.string().max(255).allow(null),
  default_address: Joi.number().integer().allow(null),
  created_at: Joi.date()
    .alter({
      insert: (schema) => schema.forbidden(),
      update: (schema) => schema.forbidden(),
    }),
};

const userSchema = Joi.object(userSchemaKeys);

class UserModel extends BaseModel {
  constructor() {
    super('users', userSchema);
  }

  async findByEmail(email) {
    const result = await this.findOne({ email });
    return result;
  }

  async create(data, strategy = 'local') {
    let newUser;
    if (strategy === 'local') {
      this.validateData(data, this.schema.tailor('localLogin'));
      try {
        newUser = await this.insert(data);
      } catch (error) {
        Error.captureStackTrace(error);
        if (error.code === '23505' && error.constraint === 'users_email_key') {
          error.message = 'Email already exists.';
          error.status = 400;
        }
        throw customError(error);
      }
    }
    return newUser;
  }
}

module.exports = { userSchema, UserModel };
