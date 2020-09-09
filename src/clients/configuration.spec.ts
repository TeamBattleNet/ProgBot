import { expect } from 'chai';
import { Config } from './configuration';
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
});
