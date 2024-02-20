import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { type fs, vol } from 'memfs';
import { Chip } from '../models/chip.js';

vi.mock('node:fs', async () => {
  const memfs: { fs: typeof fs } = await vi.importActual('memfs');
  return {
    promises: memfs.fs.promises,
  };
});

describe('Chip', () => {
  afterEach(() => {
    vol.reset();
    vi.restoreAllMocks();
    Chip.chipCache = {};
  });

  describe('loadCache', () => {
    let findMock: MockInstance;

    beforeEach(() => {
      findMock = vi.spyOn(Chip, 'find').mockResolvedValue([]);
    });

    it('Clears the existing cache', async () => {
      Chip.chipCache['123'] = new Chip();
      await Chip.loadCache();
      expect(Chip.chipCache).to.deep.equal({});
    });

    it('Fills the cache with found chips', async () => {
      const myChip = new Chip();
      myChip.id = 123;
      findMock.mockResolvedValue([myChip]);
      await Chip.loadCache();
      expect(findMock).toHaveBeenCalledTimes(1);
      expect(Chip.chipCache[123]).to.equal(myChip);
    });
  });

  describe('getById', () => {
    it('Returns chip from cache if it exists', () => {
      const myChip = new Chip();
      Chip.chipCache['123'] = myChip;
      expect(Chip.getById('123')).to.equal(myChip);
      expect(Chip.getById(123)).to.equal(myChip);
    });

    it('Throws an error if the request chip does not exist', () => {
      try {
        Chip.getById('123');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });

  describe('csvChipDBImport', () => {
    let queryRunnerStub: any;
    let saveStub: MockInstance;

    beforeEach(() => {
      vol.fromJSON({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,3,aqua' });
      saveStub = vi.fn();
      queryRunnerStub = {
        connection: {
          createEntityManager: () => ({ save: saveStub }),
        },
      };
    });

    it('reads from csv and saves parsed chip entities', async () => {
      await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      expect(saveStub).toHaveBeenCalledTimes(1);
      const firstParsedChip = saveStub.mock.calls[0][0][0] as Chip;
      expect(firstParsedChip.id).to.equal(1);
      expect(firstParsedChip.name).to.equal('name');
      expect(firstParsedChip.category).to.equal('std');
      expect(firstParsedChip.rarity).to.equal(2);
      expect(firstParsedChip.damage).to.equal(3);
      expect(firstParsedChip.element).to.equal('aqua');
    });

    it('skips blank lines in csv gracefully', async () => {
      vol.fromJSON({ fakeCSVFile: '\n\nid,name,category,rarity,damage,element\n\n\n1,name,std,2,3,aqua\n\n' });
      await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      expect(saveStub).toHaveBeenCalledTimes(1);
    });

    it('rejects malformed csv when missing an item column', async () => {
      vol.fromJSON({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,3' });
      expect(async () => {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      }).rejects.toThrowError();
    });

    it('rejects malformed csv when extra item column', async () => {
      vol.fromJSON({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,3,aqua,extradata' });
      expect(async () => {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      }).rejects.toThrowError();
    });

    it('rejects malformed csv when number column does not parse correctly', async () => {
      vol.fromJSON({ fakeCSVFile: 'id,name,category,rarity,damage,element\nnotNumber,name,std,2,3,aqua' });
      expect(async () => {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      }).rejects.toThrowError();
      vol.fromJSON({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,notNumber,3,aqua' });
      expect(async () => {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      }).rejects.toThrowError();
      vol.fromJSON({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,notNumber,aqua' });
      expect(async () => {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      }).rejects.toThrowError();
    });
  });
});
