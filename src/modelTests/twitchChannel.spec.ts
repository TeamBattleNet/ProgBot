import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { TwitchChannel } from '../models/twitchChannel';

describe('TwitchChannel', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isDisabledCommand', () => {
    let chan: TwitchChannel;

    beforeEach(() => (chan = new TwitchChannel()));

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
    let chan: TwitchChannel;

    beforeEach(() => (chan = new TwitchChannel()));

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
    let chan: TwitchChannel;
    let saveStub: SinonStub;

    beforeEach(() => {
      chan = new TwitchChannel();
      chan.disabledCommands = new Set();
      saveStub = sandbox.stub(chan, 'save');
    });

    it('Adds new disabled command and saves if new disabled command is provided', async () => {
      await chan.addDisabledCommands(['disabled1', 'disabled2']);
      expect(chan.disabledCommands.has('disabled1'));
      expect(chan.disabledCommands.has('disabled2'));
      assert.calledOnce(saveStub);
    });

    it('Does not save if duplicate disabled command is provided', async () => {
      chan.disabledCommands.add('disabled');
      await chan.addDisabledCommands(['disabled']);
      assert.notCalled(saveStub);
    });

    it('Throws an error if a comma is provided in a command to disable', async () => {
      try {
        await chan.addDisabledCommands(['disabled', 'bad,cmd']);
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });

  describe('removeDisabledCommands', () => {
    let chan: TwitchChannel;
    let saveStub: SinonStub;

    beforeEach(() => {
      chan = new TwitchChannel();
      chan.disabledCommands = new Set();
      saveStub = sandbox.stub(chan, 'save');
    });

    it('Removes disabled command and saves if existing disabled command is provided', async () => {
      chan.disabledCommands.add('disabled');
      await chan.removeDisabledCommands(['disabled']);
      expect(chan.disabledCommands.has('disabled')).to.be.false;
      assert.calledOnce(saveStub);
    });

    it('Does not save if non-disabled command is provided', async () => {
      await chan.removeDisabledCommands(['disabled']);
      assert.notCalled(saveStub);
    });
  });

  describe('setMinBrowseSeconds', () => {
    let chan: TwitchChannel;
    let saveStub: SinonStub;

    beforeEach(() => {
      chan = new TwitchChannel();
      saveStub = sandbox.stub(chan, 'save');
    });

    it('Saves provided minimum browse seconds', async () => {
      await chan.setMinBrowseSeconds(10);
      expect(chan.minimumBrowseSeconds).to.equal(10);
      assert.calledOnce(saveStub);
    });

    it('Does not allow minimum browse seconds to be below 0', async () => {
      await chan.setMinBrowseSeconds(-1);
      expect(chan.minimumBrowseSeconds).to.equal(0);
      assert.calledOnce(saveStub);
    });
  });

  describe('getAllChannels', () => {
    let findStub: SinonStub;

    beforeEach(() => {
      findStub = sandbox.stub(TwitchChannel, 'find');
    });

    it('Returns the results of a generic find', async () => {
      findStub.resolves('thing');
      expect(await TwitchChannel.getAllChannels()).to.equal('thing');
      assert.calledOnceWithExactly(findStub);
    });
  });

  describe('getChannel', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(TwitchChannel, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneStub.resolves('thing');
      expect(await TwitchChannel.getChannel('SoMeThInG')).to.equal('thing');
      assert.calledOnceWithExactly(findOneStub, { where: { channel: 'something' } });
    });
  });

  describe('createNewChannel', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(TwitchChannel, 'findOne');
    });

    it('Throws an error if the channel already exists', async () => {
      findOneStub.resolves('thing');
      try {
        await TwitchChannel.createNewChannel('exists');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });
});
