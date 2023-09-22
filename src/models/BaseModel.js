const { query } = require('../config/db');
const validationError = require('../utils/validationError');

class BaseModel {
  constructor(tableName, schema) {
    this.tableName = tableName;
    this.modelData = {};
    this.schema = schema;
  }

  async findById(id) {
    const sqlQuery = `
    SELECT *
    FROM ${this.tableName} as t
    WHERE t.id = $1
  `;

    const { rowCount, rows } = await query(sqlQuery, [id]);
    if (rowCount < 1) return null;
    return rows[0];
  }

  async findOne(queryObject) {
    if (Object.keys(queryObject).length === 0) {
      throw new Error('Query object is empty.');
    }

    const columns = Object.keys(queryObject);
    const values = Object.values(queryObject);

    const whereClause = columns.map((column, index) => `${column} = $${index + 1}`).join(' AND ');

    const sqlQuery = `
      SELECT *
      FROM ${this.tableName} as t
      WHERE ${whereClause}
      LIMIT 1
    `;

    const { rowCount, rows } = await query(sqlQuery, values);
    if (rowCount < 1) return null;
    return rows[0];
  }

  async insertOne(data) {
    if (data) {
      this.modelData = data;
    }
    if (!this.modelData || typeof this.modelData !== 'object') {
      throw new Error('Data must be an object.');
    }
    this.validateData(this.modelData);

    const columns = Object.keys(this.modelData);
    const values = Object.values(this.modelData);

    const columnNames = columns.join(', ');
    const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    const sqlQuery = `
      INSERT INTO ${this.tableName} (${columnNames})
      VALUES (${valuePlaceholders})
      RETURNING *;
    `;

    const { rowCount, rows } = await query(sqlQuery, values);
    if (rowCount < 1) return null;
    return rows[0];
  }

  setModelData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be an object.');
    }
    this.modelData = { ...this.modelData, ...data };
  }

  getModelData() {
    return this.modelData;
  }

  validateData(data) {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
    };
    const { error } = this.schema.validate(data, validationOptions);
    if (error) {
      validationError(error);
    }
  }
}

module.exports = BaseModel;
