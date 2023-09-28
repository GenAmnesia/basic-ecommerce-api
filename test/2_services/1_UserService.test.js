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
});
