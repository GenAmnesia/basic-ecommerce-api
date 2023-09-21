const usersRouter = require('express').Router();
const Joi = require('joi');
const passport = require('passport');
const { userSchema, UserModel } = require('../models/UserModel');
const validateBody = require('../middleware/validateBody');

const { email, password } = userSchema;

usersRouter.route('/')
  .get((req, res) => {
    res.send(`Hi ${req.user.email}`);
  })
  .post(
    validateBody(Joi.object({
      email: email.concat(Joi.required()),
      password: password.concat(Joi.required()),
    })),
    async (req, res, next) => {
      const { email, password } = req.body;
      const userModel = new UserModel();
      try {
        const newUser = await userModel.insertOne({ email, password });
        if (!newUser) throw new Error('Failed to create user.');
        res.status(201).send('User Created!');
      } catch (error) {
        if (error.code === '23505' && error.constraint === 'users_email_key') {
          error.message = 'Email already exists.';
          error.status = 400;
        }
        if (process.env.DEBUG === 'true') {
          next(error);
        } else {
          const customError = new Error(error.message);
          customError.code = error.code;
          customError.status = error.status || 500;
          next(customError);
        }
      }
    },
  );

usersRouter.route('/login')
  .post(
    validateBody(Joi.object({
      email: email.concat(Joi.required()),
      password: password.concat(Joi.required()),
    })),
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/user/login',
    }),
    (req, res) => {
      res.redirect(303, '/user');
    },
  )
  .get(
    (req, res) => {
      const errors = req.flash('error');

      if (errors.length > 0) {
        res.status(400).json({ errors });
      }
      return res.redirect('/');
    },
  );

usersRouter.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
  });
  res.redirect('/');
});

module.exports = usersRouter;
