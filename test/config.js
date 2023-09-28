/* eslint no-undef: 0 */
const { pool } = require('../src/services/DatabaseService');
const { createTestDatabase, dropTestDatabase } = require('../scripts/database');
require('dotenv').config();

before(async () => {
  await createTestDatabase();
});
after(async () => {
  await pool.end();
  await dropTestDatabase();
});
