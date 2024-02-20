import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { Literally } from '../models/literally.js';

describe('Literally', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRandomLiterally', () => {
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
      createQueryBuilderStub = vi.spyOn(Literally, 'createQueryBuilder').mockReturnValue(queryStub);
    });

    it('Returns result of getOne call from query', async () => {
      expect(await Literally.getRandomLiterally()).to.equal('result');
      expect(queryStub.getOne).toBeCalledTimes(1);
      expect(createQueryBuilderStub).toBeCalledTimes(1);
    });

    it('Orders query by random with limit 1', async () => {
      await Literally.getRandomLiterally();
      expect(queryStub.orderBy).toBeCalledTimes(1);
      expect(queryStub.orderBy).toHaveBeenCalledWith('RANDOM()');
      expect(queryStub.limit).toBeCalledTimes(1);
      expect(queryStub.limit).toHaveBeenCalledWith(1);
    });

    it('Does not use a WHERE clause when no filter', async () => {
      await Literally.getRandomLiterally();
      expect(queryStub.where).toHaveBeenCalledTimes(0);
    });

    it('Uses WHERE clause when filter provided', async () => {
      await Literally.getRandomLiterally('filter');
      expect(queryStub.where).toHaveBeenCalledWith('q.what LIKE :filter', { filter: '%filter%' });
    });
  });

  describe('isDuplicate', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(Literally, 'findOne');
    });

    it('Returns true if query with WHERE condition finds something', async () => {
      findOneMock.mockResolvedValue('exists');
      expect(await Literally.isDuplicate('what', 'clip')).to.be.true;
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith({ where: { what: 'what', clip: 'clip' } });
    });

    it('Returns false if query with WHERE condition does not find anything', async () => {
      findOneMock.mockResolvedValue(undefined);
      expect(await Literally.isDuplicate('what', 'clip')).to.be.false;
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith({ where: { what: 'what', clip: 'clip' } });
    });
  });
});
