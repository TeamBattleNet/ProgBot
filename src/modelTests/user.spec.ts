import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { User } from '../models/user.js';
import { v4 as uuidv4 } from 'uuid';

describe('User', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAdmin', () => {
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
    let saveMock: MockInstance;

    beforeEach(() => {
      saveMock = vi.fn();
      user.save = saveMock as any;
    });

    it('Creates, saves, and returns a new uuid api key', async () => {
      user.apiKey = 'old';
      expect(await user.getNewApiKey()).to.not.equal('old');
      expect(user.apiKey).to.not.equal('old');
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateNewLinkToken', () => {
    let saveMock: MockInstance;

    beforeEach(() => {
      saveMock = vi.fn();
      user.save = saveMock as any;
    });

    it('Creates, saves, and returns a new link token', async () => {
      user.linkToken = 'old';
      expect(await user.generateNewLinkToken('user')).to.not.equal('old');
      expect(user.linkToken.startsWith('user ')).to.be.true;
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByDiscordId', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(User, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneMock.mockResolvedValue('thing');
      expect(await User.findByDiscordId('test')).to.equal('thing');
      expect(findOneMock).toBeCalledTimes(1);
      expect(findOneMock).toBeCalledWith({ where: { discordUserId: 'test' } });
    });
  });

  describe('findByTwitchUserId', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(User, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneMock.mockResolvedValue('thing');
      expect(await User.findByTwitchUserId('test')).to.equal('thing');
      expect(findOneMock).toBeCalledTimes(1);
      expect(findOneMock).toBeCalledWith({ where: { twitchUserId: 'test' } });
    });
  });

  describe('findByLinkToken', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(User, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneMock.mockResolvedValue('thing');
      expect(await User.findByLinkToken('test', 'token')).to.equal('thing');
      expect(findOneMock).toBeCalledTimes(1);
      expect(findOneMock).toBeCalledWith({ where: { linkToken: 'test token' } });
    });
  });
});
