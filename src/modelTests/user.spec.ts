import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { User } from '../models/user';
import { v4 as uuidv4 } from 'uuid';

describe('User', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isAdmin', () => {
    let user: User;

    beforeEach(() => {
      user = new User();
    });
    it('Returns true if user is admin class', () => {
      user.userClass = 'admin';
      expect(user.isAdmin()).to.be.true;
    });

    it('Returns false if user is not admin class', () => {
      user.userClass = 'user';
      expect(user.isAdmin()).to.be.false;
    });
  });

  describe('hasTwitchId', () => {
    let user: User;

    beforeEach(() => {
      user = new User();
    });

    it('Returns true if user has non-placeholder twitch id', () => {
      user.twitchUserId = 'something';
      expect(user.hasTwitchId()).to.be.true;
    });

    it('Returns false if user has placeholder uuid twitch id', () => {
      user.twitchUserId = uuidv4();
      expect(user.hasTwitchId()).to.be.false;
    });
  });

  describe('hasDiscordId', () => {
    let user: User;

    beforeEach(() => {
      user = new User();
    });

    it('Returns true if user has non-placeholder discord id', () => {
      user.discordUserId = 'something';
      expect(user.hasDiscordId()).to.be.true;
    });

    it('Returns false if user has placeholder uuid discord id', () => {
      user.discordUserId = uuidv4();
      expect(user.hasDiscordId()).to.be.false;
    });
  });

  describe('getNewApiKey', () => {
    let user: User;
    let saveStub: SinonStub;

    beforeEach(() => {
      user = new User();
      saveStub = sandbox.stub(user, 'save');
    });

    it('Creates, saves, and returns a new uuid api key', async () => {
      user.apiKey = 'old';
      expect(await user.getNewApiKey()).to.not.equal('old');
      expect(user.apiKey).to.not.equal('old');
      assert.calledOnce(saveStub);
    });
  });

  describe('generateNewLinkToken', () => {
    let user: User;
    let saveStub: SinonStub;

    beforeEach(() => {
      user = new User();
      saveStub = sandbox.stub(user, 'save');
    });

    it('Creates, saves, and returns a new link token', async () => {
      user.linkToken = 'old';
      expect(await user.generateNewLinkToken('user')).to.not.equal('old');
      expect(user.linkToken.startsWith('user ')).to.be.true;
      assert.calledOnce(saveStub);
    });
  });

  describe('findByDiscordId', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(User, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneStub.resolves('thing');
      expect(await User.findByDiscordId('test')).to.equal('thing');
      assert.calledOnceWithExactly(findOneStub, { where: { discordUserId: 'test' } });
    });
  });

  describe('findByTwitchUserId', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(User, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneStub.resolves('thing');
      expect(await User.findByTwitchUserId('test')).to.equal('thing');
      assert.calledOnceWithExactly(findOneStub, { where: { twitchUserId: 'test' } });
    });
  });

  describe('findByLinkToken', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(User, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneStub.resolves('thing');
      expect(await User.findByLinkToken('test', 'token')).to.equal('thing');
      assert.calledOnceWithExactly(findOneStub, { where: { linkToken: 'test token' } });
    });
  });
});
