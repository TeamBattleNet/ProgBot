import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Quote } from '../models/quote';

describe('Quote', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getRandomQuote', () => {
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
      createQueryBuilderStub = sandbox.stub(Quote, 'createQueryBuilder').returns(queryStub);
    });

    it('Returns result of getOne call from query', async () => {
      expect(await Quote.getRandomQuote()).to.equal('result');
      assert.calledOnce(queryStub.getOne);
      assert.calledOnce(createQueryBuilderStub);
    });

    it('Orders query by random with limit 1', async () => {
      await Quote.getRandomQuote();
      assert.calledOnceWithExactly(queryStub.orderBy, 'RANDOM()');
      assert.calledOnceWithExactly(queryStub.limit, 1);
    });

    it('Does not use a WHERE clause when no filter', async () => {
      await Quote.getRandomQuote();
      assert.notCalled(queryStub.where);
    });

    it('Uses WHERE clause when filter provided', async () => {
      await Quote.getRandomQuote('filter');
      assert.calledWithExactly(queryStub.where, 'q.quote LIKE :filter OR q.user LIKE :filter', { filter: '%filter%' });
    });
  });
});
