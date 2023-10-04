/* eslint no-undef: 0 */
const chai = require('chai');

const { assert } = chai;
const chaiHttp = require('chai-http');
const { app, server } = require('../../server');
const { query } = require('../../src/services/DatabaseService');
const { UserModel } = require('../../src/models/UserModel');
const removeCreatedAtAndId = require('../../src/utils/removeCreatedAtAndId');

chai.use(chaiHttp);
describe('/user routes', () => {
  // after(() => {
  //   server.close(); // Chiudi il server Express
  // });
  describe('POST /user/login', () => {
    const route = '/user/login';
    it('Successfuly logs a user in using email and password', async () => {
      const agent = chai.request.agent(app);
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
      agent.close();
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
  describe('GET /user', () => {
    let agent;
    beforeEach(async () => {
      agent = chai.request.agent(app);
    });
    afterEach(() => {
      agent.close();
    });
    it('Returns the full profile of the authenticated user', async () => {
      await agent.post('/user/login').send(
        {
          email: 'john.doe@example.com',
          password: '123456',
        },
      );
      const res = await agent.get('/user');
      assert.equal(res.status, 200);
      const {
        first_name, last_name, email, google_id,
      } = res.body;
      assert.equal(first_name, 'John');
      assert.equal(last_name, 'Doe');
      assert.equal(email, 'john.doe@example.com');
      assert.isNull(google_id);
      assert.property(res.body, 'default_address');
      assert.property(res.body, 'id');
      assert.property(res.body, 'created_at');
      await agent.post('/user/logout');
      await agent.post('/user/login').send(
        {
          email: 'jane.smith@example.com',
          password: '123456',
        },
      );
      const res1 = await agent.get('/user');
      assert.equal(res1.status, 200);
      const {
        first_name: first_name1, last_name: last_name1, email: email1, google_id: google_id1,
      } = res1.body;
      assert.equal(first_name1, 'Jane');
      assert.equal(last_name1, 'Smith');
      assert.equal(email1, 'jane.smith@example.com');
      assert.isNull(google_id1);
      assert.property(res1.body, 'default_address');
      assert.property(res1.body, 'id');
      assert.property(res1.body, 'created_at');
    });
    it('Returns 401 if the no user is authenticated', async () => {
      const res = await chai.request(server)
        .get('/user');
      assert.equal(res.status, 401);
    });
    it('Returns a queried userId profile if the authenticated user is Admin', async () => {
      await agent.post('/user/login').send(
        {
          email: 'john.doe@example.com',
          password: '123456',
        },
      );
      const res = await agent.get('/user?userId=3');
      const userModel = new UserModel();
      const dbRecord = await userModel.getProfileById(3);
      assert.equal(res.status, 200);
      assert.deepEqual(removeCreatedAtAndId(res.body), removeCreatedAtAndId(dbRecord));
    });
    it('Does not return a queried userId profile if the authenticated user is NOT admin', async () => {
      await agent.post('/user/login').send(
        {
          email: 'jane.smith@example.com',
          password: '123456',
        },
      );
      const res = await agent.get('/user?userId=3');
      const userModel = new UserModel();
      const dbRecord = await userModel.getProfileById(3);
      assert.equal(res.status, 200);
      assert.notDeepEqual(removeCreatedAtAndId(res.body), removeCreatedAtAndId(dbRecord));
      assert.equal(res.body.email, 'jane.smith@example.com');
    });
    it('Returns 404 not found if authed user is admin but the queried userId does not exists', async () => {
      await agent.post('/user/login').send(
        {
          email: 'john.doe@example.com',
          password: '123456',
        },
      );
      const res = await agent.get('/user?userId=13');
      assert.equal(res.status, 404);
    });
  });
});
