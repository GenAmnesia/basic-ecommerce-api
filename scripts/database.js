/* eslint no-console: 0 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const username = process.env.DB_USERNAME || '';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const db_name = process.env.DB_NAME || 'basic_ecommerce';

const sqlScript = fs.readFileSync(path.join(__dirname, '../sql/schema', 'create-tables.sql'), 'utf-8');

async function createTables(_client) {
  console.log('Attempting to create the database tables using .env variables by running ./sql/schema/create-tables.sql...');
  try {
    await _client.connect();
    await _client.query(sqlScript);
    console.log('SQL script executed with no errors.');
  } catch (error) {
    console.error('Error in executing the SQL script:', error);
  } finally {
    await _client.end();
  }
}

async function createTestDatabase() {
  console.log('Attempting to create test database...');
  const createTestClient = new Client(`postgres://${username}:${password}@${host}:${port}/${username}`);
  try {
    await createTestClient.connect();
    await createTestClient.query('CREATE DATABASE test_db;');
    await createTables(new Client(`postgres://${username}:${password}@${host}:${port}/test_db`));
  } catch (error) {
    console.error('Error in creating test database:', error);
  } finally {
    console.log('Test database created.');
    await createTestClient.end();
  }
}

async function dropTestDatabase() {
  console.log('Attempting to drop test database...');
  const dropTestClient = new Client(`postgres://${username}:${password}@${host}:${port}/${username}`);
  try {
    await dropTestClient.connect();
    await dropTestClient.query('DROP DATABASE test_db;');
  } catch (error) {
    console.error('Error in dropping test database:', error);
  } finally {
    console.log('Test database dropped.');
    await dropTestClient.end();
  }
}

if (process.env.NODE_ENV !== 'test') {
  console.log('Manually running migrations.');
  createTables(new Client(`postgres://${username}:${password}@${host}:${port}/${db_name}`));
}

module.exports = { createTestDatabase, dropTestDatabase, createTables };
