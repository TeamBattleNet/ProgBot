import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { SimpleCommand } from '../models/simpleCommand';

describe('SimpleCommand', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getAllCommands', () => {
    let findStub: SinonStub;

    beforeEach(() => {
      findStub = sandbox.stub(SimpleCommand, 'find');
    });

    it('Returns the results of a generic find', async () => {
      findStub.resolves('thing');
      expect(await SimpleCommand.getAllCommands()).to.equal('thing');
      assert.calledOnceWithExactly(findStub);
    });
  });

  describe('getByCmd', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(SimpleCommand, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneStub.resolves('thing');
      expect(await SimpleCommand.getByCmd('Test')).to.equal('thing');
      assert.calledOnceWithExactly(findOneStub, { where: { cmd: 'Test' } });
    });
  });
});
