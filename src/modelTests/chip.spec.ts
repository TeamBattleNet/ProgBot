import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Chip } from '../models/chip';
import mock from 'mock-fs';

describe('Chip', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('loadCache', () => {
    let findStub: SinonStub;

    beforeEach(() => {
      findStub = sandbox.stub(Chip, 'find').resolves([]);
    });

    afterEach(() => (Chip.chipCache = {}));

    it('Clears the existing cache', async () => {
      Chip.chipCache['123'] = new Chip();
      await Chip.loadCache();
      expect(Chip.chipCache).to.deep.equal({});
    });

    it('Fills the cache with found chips', async () => {
      const myChip = new Chip();
      myChip.id = 123;
      findStub.resolves([myChip]);
      await Chip.loadCache();
      assert.calledOnce(findStub);
      expect(Chip.chipCache[123]).to.equal(myChip);
    });
  });

  describe('getById', () => {
    afterEach(() => (Chip.chipCache = {}));

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
    let saveStub: SinonStub;

    beforeEach(() => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,3,aqua' });
      saveStub = sandbox.stub();
      queryRunnerStub = {
        connection: {
          createEntityManager: sandbox.stub().returns({ save: saveStub }),
        },
      };
    });

    afterEach(() => {
      mock.restore();
    });

    it('reads from csv and saves parsed chip entities', async () => {
      await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      assert.calledOnce(saveStub);
      const firstParsedChip = saveStub.getCall(0).args[0][0];
      expect(firstParsedChip.id).to.equal(1);
      expect(firstParsedChip.name).to.equal('name');
      expect(firstParsedChip.category).to.equal('std');
      expect(firstParsedChip.rarity).to.equal(2);
      expect(firstParsedChip.damage).to.equal(3);
      expect(firstParsedChip.element).to.equal('aqua');
    });

    it('skips blank lines in csv gracefully', async () => {
      mock({ fakeCSVFile: '\n\nid,name,category,rarity,damage,element\n\n\n1,name,std,2,3,aqua\n\n' });
      await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      assert.calledOnce(saveStub);
    });

    it('rejects malformed csv when missing an item column', async () => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,3' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('rejects malformed csv when extra item column', async () => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,3,aqua,extradata' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('rejects malformed csv when number column does not parse correctly', async () => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\nnotNumber,name,std,2,3,aqua' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,notNumber,3,aqua' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,std,2,notNumber,aqua' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });
});
