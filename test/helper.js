/* eslint no-undef: 0 */
const { Client } = require('pg');
const { pool } = require('../src/config/db');
const { createTestDatabase, dropTestDatabase } = require('../scripts/database');
require('dotenv').config();

const username = process.env.DB_USERNAME || '';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';

const client = new Client(`postgres://${username}:${password}@${host}:${port}/test_db`);

before(async () => {
  await createTestDatabase();
  await client.connect();
});
after(async () => {
  await client.end();
  await pool.end();
  await dropTestDatabase();
});

module.exports = client;
