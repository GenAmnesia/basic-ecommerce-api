const userRouter = require('express').Router();
const { userSchema, UserModel } = require('../models/UserModel');
const validateBody = require('../middlewares/validateBody');
const UserService = require('../services/UserService');
const UserController = require('../controllers/UserController');

const userModel = new UserModel();
const userService = new UserService(userModel);
userService.initializePassport();
const userController = new UserController(userService);

userRouter.route('/')
  .get((req, res) => {
    res.send('Hi');
  })
  .post(
    validateBody(userSchema.tailor('localCreate')),
    userController.register,
  );

userRouter.route('/login')
  .post(
    validateBody(userSchema.tailor('localLogin')),
    UserController.localLogin(),
  );

userRouter.post(
  '/logout',
  UserController.logout,
);

module.exports = userRouter;
