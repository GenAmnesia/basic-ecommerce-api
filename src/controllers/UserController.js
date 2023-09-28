const passport = require('passport');
const customError = require('../utils/customError');

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
      res.status(201).json({ message: 'Registration successful', user: newUser });
    } catch (error) { next(customError(error)); }
  };

  static logout = (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      return res.status(200).send('User logged out.');
    });
  };
}

module.exports = UserController;
