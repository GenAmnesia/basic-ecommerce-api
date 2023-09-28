const { Pool } = require('pg');

require('dotenv').config();

class DatabaseService {
  constructor() {
    this.dbConfig = {
      user: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.NODE_ENV === 'test' ? 'test_db' : process.env.DB_NAME || 'basic_ecommerce',
    };
    this.pool = new Pool(this.dbConfig);
  }

  query = async (text, params) => {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DB_DEBUG === 'true') {
      console.log('executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  };

  getClient = async () => {
    const client = await this.pool.connect();
    const { query } = client; //eslint-disable-line
    const { release } = client;
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);
    // monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };
    client.release = () => {
      // clear our timeout
      clearTimeout(timeout);
      // set the methods back to their old un-monkey-patched version
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    return client;
  };
}

module.exports = new DatabaseService();
