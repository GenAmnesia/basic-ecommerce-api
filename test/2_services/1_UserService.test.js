/* eslint no-undef: 0 */
const { assert } = require('chai');
const sinon = require('sinon');
const UserService = require('../../src/services/UserService');
const { UserModel } = require('../../src/models/UserModel');

describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userModelStub = sinon.createStubInstance(UserModel);
      userModelStub.findByEmail.resolves(null);

      const userService = new UserService(userModelStub);

      const user = {
        email: 'test@example.com',
        password: 'password',
      };

      await userService.createUser(user);

      sinon.assert.calledOnce(userModelStub.findByEmail);
      sinon.assert.calledWithExactly(userModelStub.findByEmail, 'test@example.com');

      sinon.assert.calledOnce(userModelStub.create);
      sinon.assert.calledWithExactly(userModelStub.create, {
        email: 'test@example.com',
        password: sinon.match.string,
      }, 'local');
    });

    it('should throw an error if the user already exists', async () => {
      const userModelStub = sinon.createStubInstance(UserModel);
      userModelStub.findByEmail.resolves({ /* Existent user */ });

      const userService = new UserService(userModelStub);

      const user = {
        email: 'test@example.com',
        password: 'password',
      };

      try {
        await userService.createUser(user);
      } catch (error) {
        assert.equal(error.message, 'User already exists');
        assert.equal(error.status, 409);
      }
    });
  });
  describe('getProfile', () => {
    it('Correctly returns a full user profile calling the model', async () => {
      const expectedUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'user@example.com',
        google_id: 'string',
        default_address: {
          id: 1,
          recipient_name: 'John Doe',
          street_address: 'Via Benedetto Croce, 26',
          city: 'Napoli',
          state_province: 'NA',
          postal_code: '80100',
          country: 'it',
          phone_number: '333-4443322',
          notes: 'string',
          created_at: '2023-10-04T08:48:58.792Z',
        },
        created_at: '2023-10-04T08:48:58.792Z',
      };
      const userModelStub = sinon.createStubInstance(UserModel);
      userModelStub.getProfileById.resolves(expectedUser);

      const userService = new UserService(userModelStub);

      const userProfile = await userService.getProfile(1);

      sinon.assert.calledOnce(userModelStub.getProfileById);
      sinon.assert.calledWithExactly(userModelStub.getProfileById, 1);
      assert.equal(userProfile, expectedUser);
    });
    it('Throws validation error if the id parameter is not an integer', async () => {
      const tests = ['string', '1', 1.2, [1], {}];
      const userModelStub = sinon.createStubInstance(UserModel);
      const userService = new UserService(userModelStub);
      await Promise.all(
        tests.map(async (t) => {
          let err;
          try {
            await userService.getProfile(t);
          } catch (_err) { err = _err; }
          assert.instanceOf(err, Error);
          assert.equal(err.code, 'VALIDATION');
        }),
      );
    });
  });
});
