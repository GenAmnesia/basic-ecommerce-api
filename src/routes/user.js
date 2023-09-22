const usersRouter = require('express').Router();
const Joi = require('joi');
const passport = require('passport');
const { userSchema, UserModel } = require('../models/UserModel');
const validateBody = require('../middleware/validateBody');

const loginSchema = Joi.object({
  email: userSchema.email.concat(Joi.required()),
  password: userSchema.password.concat(Joi.required()),
});

usersRouter.route('/')
  .get((req, res) => {
    res.send(`Hi ${req.user.email}`);
  })
  .post(
    validateBody(loginSchema),
    async (req, res, next) => {
      const { email, password } = req.body;
      const userModel = new UserModel();
      try {
        const newUser = await userModel.createLocal(email, password);
        if (!newUser) throw new Error('Failed to create user.');
        res.status(201).send('User Created!');
      } catch (error) {
        next(error);
      }
    },
  );

usersRouter.route('/login')
  .post(
    validateBody(loginSchema),
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
