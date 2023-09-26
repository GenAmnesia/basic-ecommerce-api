/* eslint no-undef: 0 */
const chai = require('chai');
const Joi = require('joi');
const BaseModel = require('../../src/models/BaseModel');
const { query } = require('../../src/config/db');

const { assert } = chai;
require('dotenv').config();

describe('BaseModel tests', () => {
  const schemaKeys = {
    id: Joi.number().integer()
      .alter({
        insert: (schema) => schema.forbidden(),
        update: (schema) => schema.forbidden(),
      }),
    username: Joi.string().max(255)
      .alter({
        insert: (schema) => schema.required(),
      }),
    email: Joi.string().email().max(255)
      .alter({
        insert: (schema) => schema.required(),
      }),
    age: Joi.number().integer().allow(null),
    city: Joi.string().max(255).allow(null),
    created_at: Joi.date()
      .alter({
        insert: (schema) => schema.forbidden(),
        update: (schema) => schema.forbidden(),
      }),
  };
  const testSchema = Joi.object(schemaKeys);
  before(async () => {
    await query(`
      CREATE TABLE test (
        id serial PRIMARY KEY,
        username varchar(255) NOT NULL,
        email varchar(255) UNIQUE NOT NULL,
        age integer,
        city varchar(255),
        created_at timestamp DEFAULT NOW()
      );
    `);

    const insertPromises = [
      query(`
        INSERT INTO test (username, email, age, city)
        VALUES ($1, $2, $3, $4);
      `, ['user1', 'user1@example.com', 25, 'New York']),
      query(`
        INSERT INTO test (username, email, age, city)
        VALUES ($1, $2, $3, $4);
      `, ['user2', 'user2@example.com', 30, 'Los Angeles']),
      query(`
        INSERT INTO test (username, email, age, city)
        VALUES ($1, $2, $3, $4);
      `, ['user3', 'user3@example.com', 22, 'Chicago']),
      query(`
        INSERT INTO test (username, email, age, city)
        VALUES ($1, $2, $3, $4);
      `, ['user4', 'user4@example.com', 35, 'San Francisco']),
    ];
    await insertPromises.reduce(async (prev, curr) => {
      await prev;
      await curr;
    }, Promise.resolve());
    // const { rows } = await query('SELECT * from test;');
    // console.log('db', rows);
  });

  after(async () => {
    await query(`
      DROP TABLE test;
    `);
  });
  describe('validateData', () => {
    it('Correctly validates a schema', async () => {
      const baseModel = new BaseModel('test', testSchema);
      let error;
      try {
        // Validation of the first set of data
        baseModel.validateData({
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          age: 25,
          city: 'New York',
          created_at: new Date(),
        });

        // Validation of the second set of data
        baseModel.validateData({
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          age: 30,
          city: 'Los Angeles',
          created_at: new Date(),
        });

        // Validation of the third set of data
        baseModel.validateData({
          id: 3,
          username: 'user3',
          email: 'user3@example.com',
          age: 22,
          city: 'Chicago',
          created_at: new Date(),
        });

        // Validation of the fourth set of data
        baseModel.validateData({
          id: 4,
          username: 'user4',
          email: 'user4@example.com',
          age: 35,
          city: 'San Francisco',
          created_at: new Date(),
        });
      } catch (err) {
        error = err;
      }
      assert.isNotOk(error);
    });
    it('Throws an error when data is invalid', async () => {
      const baseModel = new BaseModel('test', testSchema);
      const tests = [
        { id: 1, username: 1 },
        { id: '1', username: '1' },
        { id: 1, usernames: '1' },
        { id: 1, username: 'test1', invalid: '2023' },
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
      const baseModel = new BaseModel('test', testSchema);
      const tests = [[1, 'value1'], [2, 'value2'], [3, 'value3']];
      tests.forEach((test) => {
        baseModel.setModelData({ id: test[0], username: test[1] });
        assert.deepEqual({ id: test[0], username: test[1] }, baseModel.modelData);
      });
    });
    it('Throws error when trying to set invalid data', () => {
      const baseModel = new BaseModel('test', testSchema);
      const tests = [
        { id: 1, username: 1 },
        { id: '1', username: '1' },
        { id: 1, usernames: '1' },
        { id: 1, username: 'test1', invalid: '2023' },
        { username: 'test1', invalid: '2023' },
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
        { username: 'value1' },
        { email: 'g@g.it' },
      ];
      tests.forEach((test) => {
        const testModel = new BaseModel('test', testSchema);
        testModel.modelData = { id: 1, username: 'test', email: 'test@test.it' };
        testModel.updateModelData(test);
        const expectedResult = {
          id: test.id || testModel.modelData.id,
          username: test.username || testModel.modelData.username,
          email: test.email || testModel.modelData.email,
        };
        assert.deepEqual(expectedResult, testModel.modelData);
      });
    });
    it('Throws error when trying to update with invalid data', () => {
      const tests = [
        { username: 123 },
        { id: 2 },
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
      const promises = [1, 2, 3, 4].map(async (value) => {
        const testModel = new BaseModel('test', testSchema);
        const result = await testModel.findById(value);
        const dbResult = await query('SELECT * FROM test WHERE id = $1;', [value]);
        assert.equal(result.id, dbResult.rows[0].id);
        assert.equal(result.username, dbResult.rows[0].username);
        assert.equal(result.email, dbResult.rows[0].email);
      });
      await Promise.all(promises);
    });
    it('Returns null when not finding an object', async () => {
      const testModel = new BaseModel('test', testSchema);
      const result = await testModel.findById(14);
      assert.isNull(result);
    });
    it('Throws an error when not using an integer', async () => {
      const testModel = new BaseModel('test', testSchema);
      let error;
      try {
        await testModel.findById('test');
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
  });
  describe('findOne', () => {
    it('Finds correctly a record by a property', async () => {
      const testModel = new BaseModel('test', testSchema);
      await [1, 2, 3, 4].reduce(async (prevPromise, value) => {
        await prevPromise;
        const result = await testModel.findOne({ username: `user${value}` });
        const dbRecord = await query('SELECT * FROM test WHERE username = $1 LIMIT 1;', [`user${value}`]);
        assert.deepEqual(result, dbRecord.rows[0]);
      }, Promise.resolve());
    });
    it('Finds correctly a record by more than one property', async () => {
      const testModel1 = new BaseModel('test', testSchema);
      const testModel2 = new BaseModel('test', testSchema);
      const tests = [
        { username: 'user1', email: 'user1@example.com' },
        { city: 'Chicago', age: 22 },
      ];
      const result1 = await testModel1.findOne(tests[0]);
      const result2 = await testModel2.findOne(tests[1]);
      const dbRecord1 = await query('SELECT * FROM test WHERE username = $1 AND email = $2 LIMIT 1;', [tests[0].username, tests[0].email]);
      const dbRecord2 = await query('SELECT * FROM test WHERE city = $1 AND age = $2 LIMIT 1;', [tests[1].city, tests[1].age]);
      assert.deepEqual(result1, dbRecord1.rows[0]);
      assert.deepEqual(result2, dbRecord2.rows[0]);
    });
    it('Returns null when not finding an object', async () => {
      const testModel = new BaseModel('test', testSchema);
      const result = await testModel.findOne({ username: 'value12' });
      assert.isNull(result);
    });
    it('Throws an error when using an invalid type', async () => {
      const testModel = new BaseModel('test', testSchema);
      let error;
      try {
        await testModel.findOne({ username: 12 });
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
    it('Throws an error when using an invalid property', async () => {
      const testModel = new BaseModel('test', testSchema);
      let error;
      try {
        await testModel.findOne({ id: 1, invalid: '12' });
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.equal(error.code, 'VALIDATION');
    });
  });
  describe('insert', () => {
    afterEach(async () => {
      await query('DELETE FROM test WHERE id > 4');
    });
    it('Successfully inserts a data model to the database', async () => {
      const tests = [5, 6, 7].map((v) => ({ username: `user${v}`, email: `user${v}@example.com` }));
      await tests.reduce(async (prevPromise, testData) => {
        await prevPromise;
        const testModel = new BaseModel('test', testSchema);
        testModel.setModelData(testData);
        await testModel.insert();
        const dbResult = await query('SELECT * FROM test WHERE username = $1 LIMIT 1', [testData.username]);
        assert.deepEqual(testData, {
          username: dbResult.rows[0].username, email: dbResult.rows[0].email,
        });
        assert.deepEqual(testData, {
          username: testModel.getModelData().username, email: testModel.getModelData().email,
        });
      }, Promise.resolve());
    });
    it('Successfully inserts directly inserted data to the model and database', async () => {
      const tests = [5, 6, 7].map((v) => ({ username: `user${v}`, email: `user${v}@example.com` }));
      const promises = tests.map(async (testData) => {
        const testModel = new BaseModel('test', testSchema);
        await testModel.insert(testData);
        const dbResult = await query('SELECT * FROM test WHERE username = $1 LIMIT 1', [testData.username]);
        assert.deepEqual(testData, {
          username: dbResult.rows[0].username, email: dbResult.rows[0].email,
        });
        assert.deepEqual(testData, {
          username: testModel.getModelData().username, email: testModel.getModelData().email,
        });
      });
      await Promise.all(promises);
    });
    it('Throws error when trying to save invalid data', async () => {
      const tests = [
        { id: '1' },
        { value: 'value' },
        { id: 1, value: 'value', invalid: 'true' },
        {
          id: 10, username: 'user10', email: 'user10@email.com', age: 25, city: 'Chicago',
        },
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
  describe('findOneAndUpdate', () => {
    it('Successfully updates a record based on query and data', async () => {
      const tests = [
        { q: { username: 'user2' }, d: { age: 26, city: 'Boston' } },
        { q: { age: 35, city: 'San Francisco' }, d: { age: 18, email: 'updated@example.com' } },
      ];
      const testModel1 = new BaseModel('test', testSchema);
      const testModel2 = new BaseModel('test', testSchema);

      const originalRecord1 = await query('SELECT * FROM test WHERE username = $1 LIMIT 1;', ['user2']);
      const originalRecord2 = await query('SELECT * FROM test WHERE age = 35 AND city = $1 LIMIT 1;', ['San Francisco']);
      const updatedRecord1 = await testModel1.findOneAndUpdate(tests[0].q, tests[0].d);
      const updatedRecord2 = await testModel2.findOneAndUpdate(tests[1].q, tests[1].d);

      assert.deepEqual(updatedRecord1, { ...originalRecord1.rows[0], ...tests[0].d });
      assert.deepEqual(updatedRecord2, { ...originalRecord2.rows[0], ...tests[1].d });
    });
    it('Returns null when no record matches the query', async () => {
      const testModel = new BaseModel('test', testSchema);

      const test1 = await testModel.findOneAndUpdate({ id: 100 }, { email: 'invalid' });
      const test2 = await testModel.findOneAndUpdate({ username: 'try' }, { email: 'me' });
      assert.isNull(test1);
      assert.isNull(test2);
    });
    it('Throws an error when queryObject or data are empty', async () => {
      const testModel = new BaseModel('test', testSchema);
      let errorQuery;
      let errorData;
      try {
        await testModel.findOneAndUpdate({}, { username: 'valid' });
      } catch (_errorQuery) {
        errorQuery = _errorQuery;
      }
      try {
        await testModel.findOneAndUpdate({ id: 1 }, {});
      } catch (_errorData) {
        errorData = _errorData;
      }
      assert.instanceOf(errorQuery, Error);
      assert.instanceOf(errorData, Error);
    });
    it('Throws an error when given invalid properties', async () => {
      const tests = [
        { q: { id: 2 }, v: { invalid: 'property' } },
      ];
      const testModel = new BaseModel('test', testSchema);
      let error;
      try {
        await testModel.findOneAndUpdate(tests[0].q, tests[0].d);
      } catch (_error) {
        error = _error;
      }
      assert.instanceOf(error, Error);
    });
  });
});
