/* eslint no-undef: 0 */
const chai = require('chai');
const Joi = require('joi');
const BaseModel = require('../../src/models/BaseModel');
const { query } = require('../../src/config/db');

const { assert } = chai;
require('dotenv').config();

describe('BaseModel tests', () => {
  const schemaKeys = {
    id: Joi.number().integer(),
    value: Joi.string().max(255),
  };
  const testSchema = {
    base: Joi.object(schemaKeys),
    post: Joi.object({
      ...schemaKeys,
      id: schemaKeys.id.required(),
    }),
  };
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
  describe('setModelData', () => {
    it('Correctly sets valid data in the model', () => {
      const tests = [[1, 'value1'], [2, 'value2'], [3, 'value3']];
      tests.forEach((test) => {
        baseModel.setModelData({ id: test[0], value: test[1] });
        assert.deepEqual({ id: test[0], value: test[1] }, baseModel.modelData);
      });
    });
    it('Throws error when trying to set invalid data', () => {
      const tests = [
        { id: 1, value: 1 },
        { id: '1', value: '1' },
        { id: 1, values: '1' },
        { id: 1, value: 'test1', invalid: '2023' },
        { value: 'test1', invalid: '2023' },
        { value: 'test1' },
      ];
      tests.forEach((test, i) => {
        let error;
        try {
          baseModel.setModelData(test);
        } catch (err) {
          error = err;
        }
        assert.instanceOf(error, Error, `Test #${i + 1} should throw an error`);
        assert.equal(error.code, 'VALIDATION');
      });
    });
  });
  describe('updateModelData', () => {
    it('Successfully updates a data model', () => {
      const tests = [
        { value: 'value1' },
        { id: 2 },
      ];
      tests.forEach((test) => {
        const testModel = new BaseModel('test', testSchema);
        testModel.modelData = { id: 1, value: 'test' };
        testModel.updateModelData(test);
        const expectedResult = {
          id: test.id || testModel.modelData.id,
          value: test.value || testModel.modelData.value,
        };
        assert.deepEqual(expectedResult, testModel.modelData);
      });
    });
    it('Throws error when trying to update with invalid data', () => {
      const tests = [
        { value: 123 },
        { id: '2' },
        { invalid: 'value' },
        { id: 1, value: 'valid', invalid: 'value' },
      ];
      tests.forEach((test, i) => {
        const testModel = new BaseModel('test', testSchema);
        testModel.modelData = { id: 1, value: 'test' };
        let error;
        try {
          testModel.updateModelData(test);
        } catch (err) {
          error = err;
        }
        assert.instanceOf(error, Error, `Test #${i + 1} should throw an error`);
        assert.equal(error.code, 'VALIDATION');
      });
    });
  });
  describe('getModelData', () => {
    it('Correctly returns given data', () => {
      const tests = [1, 2, 3].map((v) => ({ id: v, value: `test${v}` }));
      tests.forEach((test) => {
        const testModel = new BaseModel('test', testSchema);
        testModel.modelData = test;
        assert.deepEqual(test, testModel.getModelData());
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
        return prevPromise;
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
        return prevPromise;
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
        await baseModel.findOne({ id: 1, invalid: '12' });
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
  });
  describe('insert', () => {
    after(async () => {
      await query('DELETE FROM test WHERE id > 10');
    });
    it('Successfully inserts a data model to the database', async () => {
      const tests = [11, 12, 13].map((v) => ({ id: v, value: `test${v}` }));
      await tests.reduce(async (prevPromise, testData) => {
        await prevPromise;
        const testModel = new BaseModel('test', testSchema);
        testModel.modelData = testData;
        await testModel.insert();
        const dbResult = await query(`SELECT * FROM test WHERE id = ${testData.id}`);
        assert.deepEqual(testData, dbResult.rows[0]);
        return prevPromise;
      }, Promise.resolve());
    });
    it('Successfully inserts directly inserted data to the model and database', async () => {
      const tests = [14, 15, 16].map((v) => ({ id: v, value: `test${v}` }));
      const promises = tests.map(async (testData) => {
        const testModel = new BaseModel('test', testSchema);
        await testModel.insert(testData);
        const dbResult = await query(`SELECT * FROM test WHERE id = ${testData.id}`);
        assert.deepEqual(testModel.modelData, testData);
        assert.deepEqual(dbResult.rows[0], testData);
      });
      await Promise.all(promises);
    });
    it('Throws error when trying to save invalid data', async () => {
      const tests = [
        { id: '1' },
        { value: 'value' },
        { id: 1, value: 'value', invalid: 'true' },
      ];
      const promises = tests.map(async (testData) => {
        const testModel = new BaseModel('test', testSchema);
        let error;
        try {
          await testModel.insert(testData);
        } catch (err) {
          error = err;
        }
        assert.instanceOf(error, Error);
        assert.equal(error.code, 'VALIDATION');
      });
      await Promise.all(promises);
    });
  });
  describe('findMany', () => {
    const findTestSchemaKeys = {
      id: Joi.number().integer(),
      name: Joi.string().max(255),
      age: Joi.number().integer(),
    };
    const findTestSchema = {
      base: Joi.object(findTestSchemaKeys),
      post: Joi.object({
        ...findTestSchemaKeys,
        id: findTestSchemaKeys.id.forbidden(),
        name: findTestSchemaKeys.name.required(),
      }),
    };
    before(async () => {
      await query(`
        CREATE TABLE "find_test_table" (
          id serial PRIMARY KEY,
          name varchar(255) NOT NULL,
          age integer
        );
      `);
      await query(`
        INSERT INTO "find_test_table" (name, age)
        VALUES ('John', 30), ('Jane', 25), ('Bob', 35);
      `);
    });

    after(async () => {
      await query(`
        DROP TABLE "find_test_table";
      `);
    });
    it('Finds records based on a WHERE clause', async () => {
      const testModel = new BaseModel('find_test_table', findTestSchema);

      const results = await testModel.findMany(
        { where: 'age >= $1' },
        [30],
      );

      assert.isArray(results);
      assert.lengthOf(results, 2);
      results.forEach((record) => {
        assert.property(record, 'name');
        assert.property(record, 'age');
      });
    });
    it('Handles ordering and limiting', async () => {
      const testModel = new BaseModel('find_test_table', findTestSchema);

      const results = await testModel.findMany({
        where: 'age > $1',
        order_by: 'age DESC',
        limit: 2,
      }, [25]);

      assert.isArray(results);
      assert.lengthOf(results, 2);
      assert.isAbove(results[0].age, results[1].age);
    });
    it('Handles cases where no records match the WHERE clause', async () => {
      const testModel = new BaseModel('find_test_table', findTestSchema);
      const results = await testModel.findMany({ where: 'age < $1' }, [20]);
      assert.isArray(results);
      assert.isEmpty(results);
    });
    it('Throws an error if WHERE clause is missing', async () => {
      const testModel = new BaseModel('find_test_table', findTestSchema);
      let error;
      try {
        await testModel.findMany({});
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
    });
  });
});
