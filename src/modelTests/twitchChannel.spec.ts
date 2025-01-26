import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { TwitchChannel } from '../models/twitchChannel.js';

describe('TwitchChannel', () => {
  let chan: TwitchChannel;

  beforeEach(() => {
    chan = new TwitchChannel();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isDisabledCommand', () => {
    it('Returns true if command is disabled', () => {
      chan.disabledCommands = new Set(['disabled']);
      expect(chan.isDisabledCommand('disabled')).to.be.true;
    });

    it('Returns false if command is not disabled', () => {
      chan.disabledCommands = new Set();
      expect(chan.isDisabledCommand('disabled')).to.be.false;
    });
  });

  describe('canBrowse', () => {
    it('Returns true if now - lastBrowseTime is above minimum channel browse seconds', () => {
      chan.minimumBrowseSeconds = 10;
      const old = new Date();
      old.setUTCSeconds(old.getUTCSeconds() - 11);
      expect(chan.canBrowse(old)).to.be.true;
    });

    it('Returns false if now - lastBrowseTime is below minimum channel browse seconds', () => {
      chan.minimumBrowseSeconds = 10;
      expect(chan.canBrowse(new Date())).to.be.false;
    });
  });

  describe('addDisabledCommands', () => {
    let saveMock: MockInstance;

    beforeEach(() => {
      chan.disabledCommands = new Set();
      saveMock = vi.fn();
      chan.save = saveMock as any;
    });

    it('Adds new disabled command and saves if new disabled command is provided', async () => {
      await chan.addDisabledCommands(['disabled1', 'disabled2']);
      expect(chan.disabledCommands.has('disabled1'));
      expect(chan.disabledCommands.has('disabled2'));
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('Does not save if duplicate disabled command is provided', async () => {
      chan.disabledCommands.add('disabled');
      await chan.addDisabledCommands(['disabled']);
      expect(saveMock).toHaveBeenCalledTimes(0);
    });

    it('Throws an error if a comma is provided in a command to disable', async () => {
      await expect(async () => {
        await chan.addDisabledCommands(['disabled', 'bad,cmd']);
      }).rejects.toThrowError();
    });
  });

  describe('removeDisabledCommands', () => {
    let saveMock: MockInstance;

    beforeEach(() => {
      chan.disabledCommands = new Set();
      saveMock = vi.fn();
      chan.save = saveMock as any;
    });

    it('Removes disabled command and saves if existing disabled command is provided', async () => {
      chan.disabledCommands.add('disabled');
      await chan.removeDisabledCommands(['disabled']);
      expect(chan.disabledCommands.has('disabled')).to.be.false;
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('Does not save if non-disabled command is provided', async () => {
      await chan.removeDisabledCommands(['disabled']);
      expect(saveMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('setMinBrowseSeconds', () => {
    let saveMock: MockInstance;

    beforeEach(() => {
      saveMock = vi.fn();
      chan.save = saveMock as any;
    });

    it('Saves provided minimum browse seconds', async () => {
      await chan.setMinBrowseSeconds(10);
      expect(chan.minimumBrowseSeconds).to.equal(10);
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('Does not allow minimum browse seconds to be below 0', async () => {
      await chan.setMinBrowseSeconds(-1);
      expect(chan.minimumBrowseSeconds).to.equal(0);
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllChannels', () => {
    let findMock: MockInstance;

    beforeEach(() => {
      findMock = vi.spyOn(TwitchChannel, 'find');
    });

    it('Returns the results of a generic find', async () => {
      findMock.mockResolvedValue('thing');
      expect(await TwitchChannel.getAllChannels()).to.equal('thing');
      expect(findMock).toHaveBeenCalledTimes(1);
      expect(findMock).toHaveBeenCalledWith();
    });
  });

  describe('getChannel', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(TwitchChannel, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneMock.mockResolvedValue('thing');
      expect(await TwitchChannel.getChannel('SoMeThInG')).to.equal('thing');
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith({ where: { channel: 'something' } });
    });
  });

  describe('createNewChannel', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(TwitchChannel, 'findOne');
    });

    it('Throws an error if the channel already exists', async () => {
      findOneMock.mockResolvedValue('thing');
      await expect(async () => {
        await TwitchChannel.createNewChannel('exists');
      }).rejects.toThrowError();
    });
  });
});
