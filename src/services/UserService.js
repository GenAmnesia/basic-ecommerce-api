const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const customError = require('../utils/customError');
const { userSchemaKeys } = require('../models/UserModel');
const validationError = require('../utils/validationError');
const { query } = require('./DatabaseService');

class UserService {
  constructor(userModel) {
    this.userModel = userModel;
  }

  initializePassport = () => {
    UserService.serializeUser();
    this.deserializeUser();
    this.useLocalStrategy();
  };

  useLocalStrategy = () => {
    passport.use(
      new LocalStrategy(
        { usernameField: 'email' },
        async (username, password, done) => {
          try {
            const user = await this.userModel.findByEmail(username);
            if (!user) return done(null, false, { message: 'Incorrect username.' });
            const matchedPassword = await bcrypt.compare(password, user.password);
            if (!matchedPassword) {
              return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
  };

  static serializeUser = () => {
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
  };

  deserializeUser = () => {
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.userModel.findById(id);
        user.isAdmin = await UserService.isAdmin(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });
  };

  createUser = async (user) => {
    const { email, password } = user;
    try {
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        throw customError(new Error('User already exists'), 409);
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const newUser = {
        ...user,
        password: hash,
      };
      const createdUser = await this.userModel.create(newUser, 'local');
      return createdUser;
    } catch (error) { throw customError(error); }
  };

  static isAdmin = async (id) => {
    const { error: idValidationError } = userSchemaKeys.id.validate(id, {
      allowUnknown: false,
      convert: false,
    });
    if (idValidationError) throw validationError(idValidationError);
    const { rows, rowCount } = await query('SELECT * FROM admins WHERE user_id = $1 LIMIT 1;', [id]);
    if (rowCount > 0 && rows[0].user_id === id) return true;
    return false;
  };

  getProfile = async (id) => {
    const { error: idValidationError } = userSchemaKeys.id.validate(id, {
      allowUnknown: false,
      convert: false,
    });
    if (idValidationError) throw validationError(idValidationError);

    const userProfile = await this.userModel.getProfileById(id);
    return userProfile;
  };
}

module.exports = UserService;
