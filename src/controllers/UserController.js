const passport = require('passport');
const customError = require('../utils/customError');
const UserService = require('../services/UserService');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  static localLogin = () => (req, res, next) => passport.authenticate('local', (err, user) => {
    if (err) { return next(err); }
    if (!user) { return next(customError(new Error('Invalid credentials'), 401)); }
    return req.login(user, (_err) => {
      if (_err) { return next(_err); }
      return res.status(200).json({ message: 'Login successful' });
    });
  })(req, res, next);

  register = async (req, res, next) => {
    try {
      const newUser = await this.userService.createUser(req.body);
      return res.status(201).json({ message: 'Registration successful', user: newUser });
    } catch (error) { next(customError(error)); }
  };

  static logout = (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      return res.status(200).json({ message: 'User logged out.' });
    });
  };

  getProfile = async (req, res, next) => {
    try {
      if (!req.user.id) {
        throw customError(new Error('Unexpected error'), 500);
      }
      const requestedProfileId = (req.query.userId && req.user.isAdmin)
        ? Number(req.query.userId)
        : req.user.id;

      const userProfile = await this.userService.getProfile(requestedProfileId);
      if (userProfile === null) {
        throw customError(new Error('User not found'), 404);
      }
      return res.status(200).send(userProfile);
    } catch (_err) {
      return next(_err);
    }
  };
}

module.exports = UserController;
