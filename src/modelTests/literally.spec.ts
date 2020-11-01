import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Literally } from '../models/literally';

describe('Literally', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getRandomLiterally', () => {
    let createQueryBuilderStub: SinonStub;
    let queryStub: any;

    beforeEach(() => {
      queryStub = {
        where: sandbox.stub(),
        orderBy: sandbox.stub(),
        limit: sandbox.stub(),
        getOne: sandbox.stub(),
      };
      queryStub.where.returns(queryStub);
      queryStub.orderBy.returns(queryStub);
      queryStub.limit.returns(queryStub);
      queryStub.getOne.resolves('result');
      createQueryBuilderStub = sandbox.stub(Literally, 'createQueryBuilder').returns(queryStub);
    });

    it('Returns result of getOne call from query', async () => {
      expect(await Literally.getRandomLiterally()).to.equal('result');
      assert.calledOnce(queryStub.getOne);
      assert.calledOnce(createQueryBuilderStub);
    });

    it('Orders query by random with limit 1', async () => {
      await Literally.getRandomLiterally();
      assert.calledOnceWithExactly(queryStub.orderBy, 'RANDOM()');
      assert.calledOnceWithExactly(queryStub.limit, 1);
    });

    it('Does not use a WHERE clause when no filter', async () => {
      await Literally.getRandomLiterally();
      assert.notCalled(queryStub.where);
    });

    it('Uses WHERE clause when filter provided', async () => {
      await Literally.getRandomLiterally('filter');
      assert.calledWithExactly(queryStub.where, 'q.what LIKE :filter', { filter: '%filter%' });
    });
  });

  describe('isDuplicate', () => {
    let findOneStub: SinonStub;

    beforeEach(() => {
      findOneStub = sandbox.stub(Literally, 'findOne');
    });

    it('Returns true if query with WHERE condition finds something', async () => {
      findOneStub.resolves('exists');
      expect(await Literally.isDuplicate('what', 'clip')).to.be.true;
      assert.calledOnceWithExactly(findOneStub, { where: { what: 'what', clip: 'clip' } });
    });

    it('Returns false if query with WHERE condition does not find anything', async () => {
      findOneStub.resolves(undefined);
      expect(await Literally.isDuplicate('what', 'clip')).to.be.false;
      assert.calledOnceWithExactly(findOneStub, { where: { what: 'what', clip: 'clip' } });
    });
  });
});
