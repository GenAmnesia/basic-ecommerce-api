/* eslint no-undef: 0 */
const chai = require('chai');
const fs = require('fs');
const path = require('path');
const { UserModel } = require('../../src/models/UserModel');
const { query } = require('../../src/services/DatabaseService');
const removeCreatedAtAndId = require('../../src/utils/removeCreatedAtAndId');

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
            await testModel.create(test, 'local');
          } catch (_error) {
            error = _error;
          }
          assert.instanceOf(error, Error, `Test #${i + 1} should throw an Error`);
          assert.equal(error.code, 'VALIDATION', `Test #${i + 1} should throw a VALIDATION error`);
        }, Promise.resolve());
      });
    });
  });
  describe('getProfileById', () => {
    it('Correctly returns a user profile', async () => {
      const userModel = new UserModel();
      const res1 = await userModel.getProfileById(1);
      const expectedRes1 = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        google_id: null,
        default_address: {
          recipient_name: 'John Doe',
          street_address: '123 Main St',
          city: 'New York',
          state_province: 'NY',
          postal_code: '10001',
          country: 'eu',
          phone_number: '123-456-7890',
          notes: 'Note 1',
        },
      };

      assert.deepEqual(removeCreatedAtAndId(res1), expectedRes1);
      const res2 = await userModel.getProfileById(2);
      const expectedRes2 = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        google_id: null,
        default_address: {
          recipient_name: 'Jane Smith',
          street_address: '456 Elm St',
          city: 'Los Angeles',
          state_province: 'CA',
          postal_code: '90001',
          country: 'eu',
          phone_number: '987-654-3210',
          notes: 'Note 2',
        },
      };
      assert.deepEqual(removeCreatedAtAndId(res2), expectedRes2);
    });
    it('Returns null if no user is found', async () => {
      const userModel = new UserModel();
      const res = await userModel.getProfileById(213);
      assert.isNull(res);
    });
  });
});
