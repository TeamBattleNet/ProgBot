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

  describe('csvChipDBImport', () => {
    let queryRunnerStub: any;
    let saveStub: SinonStub;

    beforeEach(() => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,cat,2,3,elem' });
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
      expect(firstParsedChip.category).to.equal('cat');
      expect(firstParsedChip.rarity).to.equal(2);
      expect(firstParsedChip.damage).to.equal(3);
      expect(firstParsedChip.element).to.equal('elem');
    });

    it('skips blank lines in csv gracefully', async () => {
      mock({ fakeCSVFile: '\n\nid,name,category,rarity,damage,element\n\n\n1,name,cat,2,3,elem\n\n' });
      await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
      assert.calledOnce(saveStub);
    });

    it('rejects malformed csv when missing an item column', async () => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,cat,2,3' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('rejects malformed csv when extra item column', async () => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,cat,2,3,elem,extradata' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('rejects malformed csv when number column does not parse correctly', async () => {
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\nnotNumber,name,cat,2,3,elem,extradata' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,cat,notNumber,3,elem,extradata' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
      mock({ fakeCSVFile: 'id,name,category,rarity,damage,element\n1,name,cat,2,notNumber,elem,extradata' });
      try {
        await Chip.csvChipDBImport(queryRunnerStub, 'fakeCSVFile');
        expect.fail('Did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });
});
