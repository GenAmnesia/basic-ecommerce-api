const { query } = require('../config/db');
const validationError = require('../utils/validationError');

class BaseModel {
  constructor(tableName, schema) {
    this.tableName = tableName;
    this.schema = schema;
    this.modelData = {};
    if (!tableName) {
      throw new Error('A model requires a table name!');
    }
    if (!schema) {
      throw new Error('A model requires a valid JOI schema!');
    }
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
    this.validateData(data, this.schema.tailor('insert'));
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
    this.validateData(data);
    this.modelData = data;
    return this;
  }

  updateModelData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be an object.');
    }
    this.validateData(data, this.schema.tailor('update'));
    this.setModelData({ ...this.modelData, ...data });
    return this;
  }

  getModelData() {
    return this.modelData;
  }

  validateData(data, schema = this.schema) {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      convert: false,
    };
    const { value, error } = schema.validate(data, validationOptions);
    if (error) {
      throw validationError(error);
    }
    return value;
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

  async #updateRecords(queryObject, data = this.modelData) {
    if (!this.modelData || typeof this.modelData !== 'object') {
      throw new Error('Data must be an object.');
    }
    this.updateModelData(data);
    this.validateData(queryObject);

    const dataColumns = Object.keys(data);
    const dataValues = Object.values(data);
    const queryColumns = Object.keys(queryObject);
    const queryValues = Object.values(queryObject);
    const values = dataValues.concat(queryValues);
    let valueCount = 0;

    const setClause = dataColumns.map((columnName) => {
      valueCount += 1;
      return `${columnName}=$${valueCount}`;
    }).join(', ');
    const whereClause = queryColumns.map((columnName) => {
      valueCount += 1;
      return `${columnName} = $${valueCount}`;
    }).join(' AND ');

    const sqlQuery = `
    UPDATE ${this.tableName}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *;
    `;

    return query(sqlQuery, values);
  }

  async findOneAndUpdate(queryObject, data = this.modelData) {
    const findResult = await this.findOne(queryObject);
    if (!findResult) return null;
    if (!findResult.id) {
      throw new Error(`Cannot find column id in ${this.tableName}.`);
    }
    const { rowCount, rows } = await this.#updateRecords({ id: findResult.id }, data);
    if (rowCount < 1) return null;
    this.setModelData(rows[0]);
    return this.getModelData();
  }

  async findManyAndUpdate(queryObject, data = this.modelData) {
    const { rowCount, rows } = await this.#updateRecords(queryObject, data);
    if (rowCount < 1) return [];
    return rows;
  }
}

module.exports = BaseModel;
