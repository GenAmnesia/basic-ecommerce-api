const Joi = require('joi');
const BaseModel = require('./BaseModel');

const userSchemaKeys = {
  id: Joi.number().integer(),
  first_name: Joi.string().min(2).max(255),
  last_name: Joi.string().min(2).max(255),
  email: Joi.string().email()
    .message('Invalid email provided'),
  password: Joi.string().pattern(/^[a-zA-Z0-9]{3,30}$/)
    .message('Passwords must have the following properties: - At least 3 characters. - At most 30 characters. - No symbols contained'),
  google_id: Joi.string().max(255),
  default_address: Joi.number().integer(),
  created_at: Joi.date().forbidden(),
};

const userSchema = {
  base: Joi.object(userSchemaKeys),
  post: Joi.object({
    ...userSchemaKeys,
    id: userSchemaKeys.id.forbidden(),
    email: userSchemaKeys.email.required(),
  }),
  localLogin: Joi.object({
    ...userSchemaKeys,
    email: userSchemaKeys.email.required(),
    password: userSchemaKeys.password.required(),
  }),
};

class UserModel extends BaseModel {
  constructor() {
    super('users', userSchema);
  }

  async findByEmail(email) {
    const result = await this.findOne({ email });
    return result;
  }

  async createLocal(email, password) {
    const data = { email, password };
    try {
      this.validateData(data, this.schema.localLogin);
      const newUser = await this.setModelData(data).save();
      return newUser;
    } catch (error) {
      Error.captureStackTrace(error);
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        error.message = 'Email already exists.';
        error.status = 400;
      }
      if (process.env.NODE_ENV === 'dev') {
        throw error;
      } else {
        const customError = new Error(error.message);
        customError.code = error.code;
        customError.status = error.status || 500;
        throw customError;
      }
    }
  }
}

module.exports = { userSchema, UserModel };
