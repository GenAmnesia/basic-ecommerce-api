/* eslint no-undef: 0 */
const chai = require('chai');
const fs = require('fs');
const path = require('path');
const { UserModel } = require('../../src/models/UserModel');
const { query } = require('../../src/config/db');

const { assert } = chai;
require('dotenv').config();

describe('UserModel tests', () => {
  before(async () => {
    const sqlScript = fs.readFileSync(path.join(__dirname, '../../sql/seeds', 'usersSeed.sql'), 'utf-8');
    await query(sqlScript);
  });
  describe('findByEmail', () => {
    it('Correctly finds an user by email', async () => {
      const testModel = new UserModel();
      const email = 'john.doe@example.com';
      const result = await testModel.findByEmail(email);
      const dbRecord = await query('SELECT * FROM users WHERE email = $1', [email]);
      assert.deepEqual(result, dbRecord.rows[0]);
    });
    it('Throws error when an invalid email is provided', async () => {
      const tests = [
        'invalidemail.com',
        12345,
        { email: 'invalid@email.com' },
        ['john.doe@example.com'],
      ];
      await tests.reduce(async (prev, test) => {
        await prev;
        const testModel = new UserModel();
        let error;
        try {
          await testModel.findByEmail(test);
        } catch (_error) {
          error = _error;
        }
        assert.instanceOf(error, Error);
      }, Promise.resolve());
    });
  });
  describe('create', () => {
    describe('local strategy', () => {
      it('Successfully creates a new user using username and password', async () => {
        const tests = [
          { email: 'testuser@email.com', password: '123456' },
          {
            first_name: 'Gen',
            last_name: 'Amnèsia',
            email: 'gennaromormile@gmail.com',
            password: '123456',
          },
        ];

        await tests.reduce(async (prev, test) => {
          await prev;
          const testModel = new UserModel();
          const result = await testModel.create(test, 'local');
          const dbRecord = await query('SELECT * FROM users WHERE email = $1 LIMIT 1;', [test.email]);
          assert.deepEqual(test.email, result.email);
          assert.deepEqual(dbRecord.rows[0], result);
          if (test.first_name && test.last_name) {
            assert.deepEqual(test.first_name, result.first_name);
            assert.deepEqual(test.last_name, result.last_name);
          }
        }, Promise.resolve());
      });
      it('Throws error if using invalid username/password dataset', async () => {
        const tests = [
          { email: 'invalid.com', password: '123456' },
          { email: 'invalid@test.com', password: 123456 },
          { email: 666, password: 123456 },
          { email: 'invalid@test.com' },
          { password: 123456 },
        ];
        await tests.reduce(async (prev, test, i) => {
          await prev;
          const testModel = new UserModel();
          let error;
          try {
            await testModel.create(test, local);
          } catch (_error) {
            error = _error;
          }
          assert.instanceOf(error, Error, `Test #${i + 1} failed`);
        }, Promise.resolve());
      });
    });
  });
});
