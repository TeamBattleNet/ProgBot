import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { Quote } from '../models/quote.js';

describe('Quote', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRandomQuote', () => {
    let createQueryBuilderStub: MockInstance;
    let queryStub: any;

    beforeEach(() => {
      queryStub = {
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getOne: vi.fn(),
      };
      queryStub.where.mockReturnValue(queryStub);
      queryStub.orderBy.mockReturnValue(queryStub);
      queryStub.limit.mockReturnValue(queryStub);
      queryStub.getOne.mockResolvedValue('result');
      createQueryBuilderStub = vi.spyOn(Quote, 'createQueryBuilder').mockReturnValue(queryStub);
    });

    it('Returns result of getOne call from query', async () => {
      expect(await Quote.getRandomQuote()).to.equal('result');
      expect(queryStub.getOne).toBeCalledTimes(1);
      expect(createQueryBuilderStub).toBeCalledTimes(1);
    });

    it('Orders query by random with limit 1', async () => {
      await Quote.getRandomQuote();
      expect(queryStub.orderBy).toBeCalledTimes(1);
      expect(queryStub.orderBy).toBeCalledWith('RANDOM()');
      expect(queryStub.limit).toBeCalledTimes(1);
      expect(queryStub.limit).toBeCalledWith(1);
    });

    it('Does not use a WHERE clause when no filter', async () => {
      await Quote.getRandomQuote();
      expect(queryStub.where).toBeCalledTimes(0);
    });

    it('Uses WHERE clause when filter provided', async () => {
      await Quote.getRandomQuote('filter');
      expect(queryStub.where).toBeCalledWith('q.quote LIKE :filter OR q.user LIKE :filter', { filter: '%filter%' });
    });
  });
});
