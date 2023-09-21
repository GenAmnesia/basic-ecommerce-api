const Joi = require('joi');
const BaseModel = require('./BaseModel');

const userSchema = {
  id: Joi.number().integer(),
  first_name: Joi.string().min(2).max(255),
  last_name: Joi.string().min(2).max(255),
  email: Joi.string().email()
    .message('Invalid email provided'),
  password: Joi.string().pattern(/^[a-zA-Z0-9]{3,30}$/)
    .message('Passwords must have the following properties: - At least 3 characters. - At most 30 characters. - No symbols contained'),
  google_id: Joi.string().max(255),
  default_address: Joi.number().integer(),
  created_at: Joi.date(),
};

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const result = await this.findOne({ email });
    return result;
  }
}

module.exports = { userSchema, UserModel };
