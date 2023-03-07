import { expect } from 'chai';
import { Config } from './configuration';
import { promises as fs } from 'fs';
import mock from 'mock-fs';

describe('coniguration', () => {
  beforeEach(() => {
    Config.configCache = undefined;
    mock({ 'runtime/config.json': '{"some":"data"}' });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('getConfig', () => {
    it('gets config from runtime/config.json', () => {
      expect(Config.getConfig()).to.deep.equal({ some: 'data' });
    });

    it('uses cached config and only reads from disk once', () => {
      expect(Config.getConfig()).to.deep.equal({ some: 'data' });
      mock({ 'runtime/config.json': '{"new":"data"}' });
      expect(Config.getConfig()).to.deep.equal({ some: 'data' });
    });
  });

  describe('reloadConfig', () => {
    it('will reload/cache new data from disk for getConfig', () => {
      mock({ 'runtime/config.json': '{"new":"data"}' });
      Config.reloadConfig();
      expect(Config.getConfig()).to.deep.equal({ new: 'data' });
    });
  });

  describe('updateTwitchAuthTokens', () => {
    it('updates config with provided tokens', async () => {
      await Config.updateTwitchAuthToken('userid', { accessToken: 'accessToken', refreshToken: 'refreshToken' } as any);
      const fileContents = JSON.parse(await fs.readFile('runtime/config.json', 'utf8'));
      expect(fileContents.twitch_bot_access_token).to.equal('accessToken');
      expect(fileContents.twitch_bot_refresh_token).to.equal('refreshToken');
    });
  });
});
