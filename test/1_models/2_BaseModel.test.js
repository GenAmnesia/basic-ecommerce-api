/* eslint no-undef: 0 */
const chai = require('chai');
const Joi = require('joi');
const BaseModel = require('../../src/models/BaseModel');
const { query } = require('../../src/config/db');

const { assert } = chai;
require('dotenv').config();

describe('BaseModel tests', () => {
  const testSchema = Joi.object({
    id: Joi.number().integer(),
    value: Joi.string().max(255),
  });
  const baseModel = new BaseModel('test', testSchema);
  const values = [[1, 'value1'], [2, 'value2'], [3, 'value3']];
  before(async () => {
    await query(`
    CREATE TABLE "test" (
      id integer PRIMARY KEY,
      value varchar(255) NOT NULL
    );
    `);
    const promises = values.map((value) => query(`
      INSERT INTO test (id, value)
      VALUES ($1, $2);
  `, [value[0], value[1]]));

    await Promise.all(promises);
  });
  after(async () => {
    await query(`
    DROP TABLE test;
    `);
  });
  describe('validateData', () => {
    it('Correctly validates a schema', async () => {
      let error;
      try {
        baseModel.validateData({ id: 1, value: 'test1' });
        baseModel.validateData({ id: 1123, value: 'test234d1' });
        baseModel.validateData({ id: 543654, value: '343543df' });
        baseModel.validateData({ id: 2341, value: 'tesdfst1' });
      } catch (err) {
        error = err;
      }
      assert.isNotOk(error);
    });
    it('Throws an error when data is invalid', async () => {
      const tests = [
        { id: 1, value: 1 },
        { id: '1', value: '1' },
        { id: 1, values: '1' },
        { id: 1, value: 'test1', invalid: '2023' },
      ];
      tests.forEach((test, i) => {
        let error;
        try {
          baseModel.validateData(test);
        } catch (err) {
          error = err;
        }
        assert.instanceOf(error, Error, `Test #${i + 1} should throw an error`);
        assert.equal(error.code, 'VALIDATION');
      });
    });
  });
  describe('findById', () => {
    it('Correctly finds an existent object by id', async () => {
      await values.reduce(async (prevPromise, value) => {
        await prevPromise;
        const result = await baseModel.findById(value[0]);
        assert.equal(result.id, value[0]);
        assert.equal(result.value, value[1]);
      }, Promise.resolve());
    });
    it('Returns null when not finding an object', async () => {
      const result = await baseModel.findById(4);
      assert.isNull(result);
    });
    it('Throws an error when not using an integer', async () => {
      let error;
      try {
        await baseModel.findById('test');
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
  });
  describe('findOne', () => {
    it('Finds correctly a value by a property', async () => {
      await values.reduce(async (prevPromise, value) => {
        await prevPromise;
        const result = await baseModel.findOne({ value: value[1] });
        assert.deepEqual(result, { id: value[0], value: value[1] });
      }, Promise.resolve());
    });
    it('Returns null when not finding an object', async () => {
      const result = await baseModel.findOne({ value: 'value12' });
      assert.isNull(result);
    });
    it('Throws an error when using an invalid type', async () => {
      let error;
      try {
        await baseModel.findOne({ value: 12 });
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
    it('Throws an error when using an invalid property', async () => {
      let error;
      try {
        await baseModel.findOne({ id: 1, values: '12' });
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
  });
});
