import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Database } from './database';
import * as typeorm from 'typeorm';

describe('database', () => {
  let sandbox: SinonSandbox;
  let getConnectionOptionsStub: SinonStub;
  let createConnectionStub: SinonStub;

  beforeEach(() => {
    Database.connection = undefined as any;
    sandbox = createSandbox();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    createConnectionStub = typeorm.createConnection = sandbox.stub().resolves({}) as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getConnectionOptionsStub = typeorm.getConnectionOptions = sandbox.stub() as any;
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
