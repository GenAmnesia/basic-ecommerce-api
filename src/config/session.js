const session = require('express-session');
require('dotenv').config();

const store = new session.MemoryStore();

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 300000000, secure: false },
  saveUninitialized: false,
  resave: false,
  store,
});

module.exports = sessionMiddleware;
