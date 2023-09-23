const { query } = require('../config/db');
const validationError = require('../utils/validationError');

class BaseModel {
  constructor(tableName, schema) {
    this.tableName = tableName;
    this.modelData = {};
    this.schema = schema;
  }

  async findById(id) {
    this.validateData({ id });
    const sqlQuery = `
    SELECT *
    FROM ${this.tableName} as t
    WHERE t.id = $1
  `;

    const { rowCount, rows } = await query(sqlQuery, [id]);
    if (rowCount < 1) return null;
    this.setModelData(rows[0]);
    return this.getModelData();
  }

  async findOne(queryObject) {
    if (Object.keys(queryObject).length === 0) {
      throw new Error('Query object is empty.');
    }
    this.validateData(queryObject);

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
    this.setModelData(rows[0]);
    return this.getModelData();
  }

  async insert(data = this.modelData) {
    if (!this.modelData || typeof this.modelData !== 'object') {
      throw new Error('Data must be an object.');
    }
    if (data !== this.modelData) {
      this.setModelData(data);
    }

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
    this.setModelData(rows[0]);
    return this.getModelData();
  }

  setModelData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be an object.');
    }
    this.validateData(data, this.schema.post);
    this.modelData = data;
    return this;
  }

  updateModelData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be an object.');
    }
    this.validateData({ ...this.modelData, ...data }, this.schema.post);
    this.modelData = { ...this.modelData, ...data };
    return this;
  }

  getModelData() {
    return this.modelData;
  }

  validateData(data, schema = this.schema.base) {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      convert: false,
    };
    const { error } = schema.validate(data, validationOptions);
    if (error) {
      throw validationError(error);
    }
  }

  async findMany(options = {}, values = []) {
    const {
      where, order_by, limit,
    } = options;

    if (!where) {
      throw new Error('WHERE clause is missing.');
    }

    let sqlQuery = `
      SELECT *
      FROM ${this.tableName} as t
      WHERE ${where}
    `;

    if (order_by) {
      sqlQuery += `
        ORDER BY ${order_by}
      `;
    }

    if (limit) {
      sqlQuery += `
        LIMIT ${limit}
      `;
    }

    sqlQuery += ';';

    const { rowCount, rows } = await query(sqlQuery, values);
    if (rowCount < 1) return [];
    return rows;
  }
}

module.exports = BaseModel;
