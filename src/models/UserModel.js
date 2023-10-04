const Joi = require('joi');
const BaseModel = require('./BaseModel');
const customError = require('../utils/customError');
const { query } = require('../services/DatabaseService');

const userSchemaKeys = {
  id: Joi.number().integer()
    .alter({
      insert: (schema) => schema.forbidden(),
      update: (schema) => schema.forbidden(),
      localLogin: (schema) => schema.forbidden(),
      localCreate: (schema) => schema.forbidden(),
    }),
  first_name: Joi.string().min(2).max(255).allow(null)
    .alter({
      localLogin: (schema) => schema.forbidden(),
    }),
  last_name: Joi.string().min(2).max(255).allow(null)
    .alter({
      localLogin: (schema) => schema.forbidden(),
    }),
  email: Joi.string().email()
    .message('Invalid email provided')
    .alter({
      insert: (schema) => schema.required(),
      localLogin: (schema) => schema.required(),
      localCreate: (schema) => schema.required(),
    }),
  password: Joi.string().max(255).allow(null)
    .message('Passwords must have the following properties: - At least 3 characters. - At most 30 characters. - No symbols contained')
    .alter({
      insert: (schema) => schema.required(),
      localLogin: (schema) => schema.pattern(/^[a-zA-Z0-9]{3,30}$/).required(),
      localCreate: (schema) => schema.required(),
    }),
  google_id: Joi.string().max(255).allow(null)
    .alter({
      localLogin: (schema) => schema.forbidden(),
    }),
  google_token: Joi.string().max(255).allow(null)
    .alter({
      localLogin: (schema) => schema.forbidden(),
    }),
  default_address: Joi.number().integer().allow(null)
    .alter({
      insert: (schema) => schema.forbidden(),
      localCreate: (schema) => schema.forbidden(),
      localLogin: (schema) => schema.forbidden(),
    }),
  created_at: Joi.date().timestamp()
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

  async create(data, strategy) {
    let newUser;
    if (strategy === 'local') {
      this.validateData(data, this.schema.tailor('localCreate'));
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
    } else {
      throw customError(new Error('UserModel.create() requires a valid strategy parameter.'));
    }
    return newUser;
  }

  async getProfileById(id = this.id) {
    const { rows, rowCount } = await query(`
    SELECT
      u.id, u.first_name, u.last_name, u.email, u.google_id, u.default_address, u.created_at,
      a.id as address_id, a.recipient_name, a.street_address, a.city, a.state_province, a.postal_code, a.country,
      a.phone_number, a.notes, a.created_at as address_created_at
    FROM users AS u
    LEFT JOIN shipping_addresses AS a ON u.default_address = a.id
    WHERE u.id = $1;
    `, [id]);
    if (rowCount < 1) return null;
    const r = rows[0];
    const default_address = r.default_address ? {
      id: r.address_id,
      recipient_name: r.recipient_name,
      street_address: r.street_address,
      city: r.city,
      state_province: r.state_province,
      postal_code: r.postal_code,
      country: r.country,
      phone_number: r.phone_number,
      notes: r.notes,
      created_at: r.address_created_at,
    } : null;
    return {
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email,
      google_id: r.google_id,
      default_address,
      created_at: r.created_at,
    };
  }
}

module.exports = { userSchemaKeys, userSchema, UserModel };
