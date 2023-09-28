require('dotenv').config();
const express = require('express');
const userRouter = require('./src/routes/userRouter');
const SessionService = require('./src/services/SessionService');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require('dotenv').config();

const sessionService = new SessionService(app);
sessionService.initialize();

app.use('/user', userRouter);

app.get('/', (req, res) => {
  res.send('hello world');
});

app.use((err, req, res, next) => {
  const customError = {
    message: err.message,
    code: err.code,
    ...err,
  };
  if (process.env.NODE_ENV === 'dev') {
    customError.stack = err.stack;
  }
  res.status(err.status || 500).json({
    error: customError,
  });
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = { app, server };
