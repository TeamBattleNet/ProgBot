import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('database', () => {
  let sandbox: SinonSandbox;
  let getConnectionOptionsStub: SinonStub;
  let createConnectionStub: SinonStub;
  let Database: any;

  beforeEach(() => {
    sandbox = createSandbox();
    createConnectionStub = sandbox.stub().resolves({});
    getConnectionOptionsStub = sandbox.stub();
    Database = proxyquire('./database', {
      typeorm: { createConnection: createConnectionStub, getConnectionOptions: getConnectionOptionsStub },
    }).Database;
    Database.connection = undefined;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initialize', () => {
    it('sets database connection', async () => {
      await Database.initialize();
      expect(Database.connection).to.not.be.undefined;
    });

    it('gets connection options from typeorm and uses them to connect', async () => {
      const dummyReturn = 'test';
      getConnectionOptionsStub.returns(dummyReturn);
      await Database.initialize();
      assert.calledOnce(getConnectionOptionsStub);
      assert.calledOnceWithExactly(createConnectionStub, dummyReturn);
    });
  });

  describe('shutdown', () => {
    it('shuts down db connection', async () => {
      const closeStub = sandbox.stub();
      Database.connection = { close: closeStub } as any;
      await Database.shutdown();
      assert.calledOnce(closeStub);
    });
  });
});
