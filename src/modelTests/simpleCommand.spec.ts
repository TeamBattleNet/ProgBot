import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { SimpleCommand } from '../models/simpleCommand.js';

describe('SimpleCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllCommands', () => {
    let findMock: MockInstance;

    beforeEach(() => {
      findMock = vi.spyOn(SimpleCommand, 'find');
    });

    it('Returns the results of a generic find', async () => {
      findMock.mockResolvedValue('thing');
      expect(await SimpleCommand.getAllCommands()).to.equal('thing');
      expect(findMock).toBeCalledTimes(1);
      expect(findMock).toBeCalledWith();
    });
  });

  describe('getByCmd', () => {
    let findOneMock: MockInstance;

    beforeEach(() => {
      findOneMock = vi.spyOn(SimpleCommand, 'findOne');
    });

    it('Returns the results of a find with WHERE condition', async () => {
      findOneMock.mockResolvedValue('thing');
      expect(await SimpleCommand.getByCmd('Test')).to.equal('thing');
      expect(findOneMock).toBeCalledTimes(1);
      expect(findOneMock).toBeCalledWith({ where: { cmd: 'Test' } });
    });
  });
});
