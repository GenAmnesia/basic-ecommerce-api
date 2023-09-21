require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const auth = require('./src/config/auth');
const usersRouter = require('./src/routes/user');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require('dotenv').config();

const store = new session.MemoryStore();

app.use(
  session({
    secret: 'f4z4gs$Gcg',
    cookie: { maxAge: 300000000, secure: false },
    saveUninitialized: false,
    resave: false,
    store,
  }),
);

app.use(flash());

auth(app);
app.use('/user', usersRouter);

app.get('/', (req, res) => {
  res.send('hello world');
});

app.use((err, req, res, next) => {
  const customError = {
    message: err.message,
    code: err.code,
    ...err,
  };
  if (process.env.DEBUG === 'true') {
    customError.stack = err.stack;
    res.status(err.status || 500).json({
      error: customError,
    });
  } else {
    res.status(err.status || 500).json({
      error: customError,
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
