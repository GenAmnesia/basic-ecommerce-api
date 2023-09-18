/* eslint no-console: 0 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const username = process.env.DB_USERNAME || '';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const name = process.env.DB_NAME || 'basic_ecommerce';

const connectionString = `postgres://${username}:${password}@${host}:${port}/${name}`;
const client = new Client({ connectionString });

const sqlScript = fs.readFileSync(path.join(__dirname, '../sql/schema', 'create-tables.sql'), 'utf-8');

async function runScript() {
  console.log('Attempting to create the database tables using .env variables by running ./sql/schema/create-tables.sql...');
  try {
    await client.connect();
    await client.query(sqlScript);
    console.log('SQL script executed with no errors.');
  } catch (error) {
    console.error('Error in executing the SQL script:', error);
  } finally {
    await client.end();
  }
}

runScript();
