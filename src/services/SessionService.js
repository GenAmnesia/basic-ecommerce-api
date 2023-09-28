const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
require('dotenv').config();

class SessionService {
  constructor(app) {
    this.app = app;
    this.store = new session.MemoryStore();
  }

  initialize = () => {
    this.#initializeSession();
    this.#initializePassport();
  };

  #initializeSession = () => {
    this.app.use(session({
      secret: process.env.SESSION_SECRET,
      cookie: { maxAge: 300000000, secure: false },
      saveUninitialized: false,
      resave: false,
      store: this.store,
    }));
  };

  #initializePassport = () => {
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(flash());
  };
}

module.exports = SessionService;
