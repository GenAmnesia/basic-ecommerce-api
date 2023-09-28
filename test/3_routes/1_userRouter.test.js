/* eslint no-undef: 0 */
const chai = require('chai');
const { URL } = require('url');

const { assert } = chai;
const chaiHttp = require('chai-http');
const { server } = require('../../server');
const { query } = require('../../src/services/DatabaseService');

chai.use(chaiHttp);
const agent = chai.request.agent(server);

describe('/user routes', () => {
  after(() => {
    server.close(); // Chiudi il server Express
  });
  describe('POST /user/login', () => {
    const route = '/user/login';
    it('Successfuly logs a user in using email and password', async () => {
      let res;
      let error;
      try {
        res = await agent
          .post(route)
          .send({
            email: 'john.doe@example.com',
            password: '123456',
          });
      } catch (_err) { error = _err; }
      assert.isNotOk(error);
      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Login successful');
    });
    it('Returns 401 on invalid credentials', async () => {
      let res;
      let error;
      try {
        res = await chai.request(server)
          .post(route)
          .send({
            email: 'invalid@email.com',
            password: '999',
          });
      } catch (_err) { error = _err; }
      assert.isNotOk(error);
      assert.equal(res.status, 401);
    });
    it('Returns 400 on bad request', async () => {
      const tests = [
        { email: '', password: '' },
        { email: 'invalidemail.it', password: '123456' },
        { email: 'valid@email.it', password: 123456 },
        { email: 'valid@email.it' },
        { password: '123456' },
      ];
      await tests.reduce(async (prev, test, i) => {
        await prev;
        let error;
        let res;
        try {
          res = await chai.request(server)
            .post(route)
            .send(test);
        } catch (_err) { error = _err; }
        assert.isNotOk(error);
        assert.equal(res.status, 400, `Test #${i} should return 400`);
        assert.equal(res.body.error.code, 'VALIDATION', `Test #${i} should return validation error`);
      }, Promise.resolve());
    });
  });
  describe('POST /user', () => {
    it('Registers a new user', async () => {
      const userData = {
        first_name: 'testName',
        last_name: 'testSurname',
        email: 'test@example.com',
        password: 'password',
      };

      const res = await chai.request(server)
        .post('/user')
        .send(userData);

      assert.equal(res.status, 201);

      const dbRecord = await query('SELECT * FROM users WHERE email = $1;', ['test@example.com']);

      // Verifica la risposta JSON
      assert.deepEqual(
        Object.keys(res.body.user).filter((key) => key !== 'created_at'),
        Object.keys(dbRecord.rows[0]).filter((key) => key !== 'created_at'),
      );
      assert.equal(res.body.message, 'Registration successful');
      assert.equal(res.body.user.first_name, userData.first_name);
      assert.equal(res.body.user.last_name, userData.last_name);
      assert.equal(res.body.user.email, userData.email);
    });

    it('Handles existent user error', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
      };

      const res = await chai.request(server)
        .post('/user')
        .send(userData);

      assert.equal(res.status, 409);
      assert.equal(res.body.error.message, 'User already exists');
    });
    it('Handles bad data errors', async () => {
      const tests = [
        { email: 123, password: '123456' },
        { email: 'valid@email.it', password: 123456 },
        { email: 'valid@email.it', password: '123456', invalid: 'property' },
        { email: 'valid@email.it', password: '123456', id: 1 },
      ];

      await tests.reduce(async (prev, test) => {
        await prev;
        const res = await chai.request(server)
          .post('/user')
          .send(test);

        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'VALIDATION');
      }, Promise.resolve());
    });
  });
});
