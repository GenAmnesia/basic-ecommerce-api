const userRouter = require('express').Router();
const { userSchema, UserModel } = require('../models/UserModel');
const validateBody = require('../middlewares/validateBody');
const UserService = require('../services/UserService');
const UserController = require('../controllers/UserController');
const isAuthenticated = require('../middlewares/isAuthenticated');

const userModel = new UserModel();
const userService = new UserService(userModel);
userService.initializePassport();
const userController = new UserController(userService);

userRouter.route('/')
  .get(
    isAuthenticated,
    userController.getProfile,
  )
  .post(
    validateBody(userSchema.tailor('localCreate')),
    userController.register,
  );

userRouter.route('/login')
  .post(
    validateBody(userSchema.tailor('localLogin')),
    UserController.localLogin(),
  );

userRouter.route('/logout')
  .post(UserController.logout);

module.exports = userRouter;
