import { promises as fs } from 'fs';
import { Entity, PrimaryColumn, Column, BaseEntity, QueryRunner } from 'typeorm';

const DEFAULT_CHIPS_CSV = 'chips/chips.csv';

@Entity()
export class Chip extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column()
  rarity: number;

  @Column()
  damage: number;

  @Column()
  element: string;

  // Can be used with migration file(s) via a provided queryRunner
  static async csvChipDBImport(queryRunner: QueryRunner, chipsCSVFile = DEFAULT_CHIPS_CSV) {
    // read in the csv
    const csvFile: string = await fs.readFile(chipsCSVFile, 'utf8');
    // Parse the csv file into Chip entities
    let columns: string[] = [];
    const chips: Chip[] = [];
    csvFile.split(/\r?\n/).forEach((row) => {
      row = row.trim();
      if (row) {
        const items = row.split(',');
        if (columns.length === 0) {
          // first row in a csv are column names
          columns = items;
        } else {
          const newChip = new Chip();
          items.forEach((item, i) => {
            // Associate item with Chip entity by named csv column
            newChip.importCSVProperty(columns[i], item);
          });
          // Ensure all properties are set, then add to list to be saved
          newChip.csvImportCheck();
          chips.push(newChip);
        }
      }
    });
    // Save the actual chip entities to the db
    await queryRunner.connection.createEntityManager(queryRunner).save(chips);
  }

  private importCSVProperty(csvColumnName: string, item: string) {
    if (csvColumnName === 'id') this.id = Number(item);
    else if (csvColumnName === 'name') this.name = item;
    else if (csvColumnName === 'category') this.category = item;
    else if (csvColumnName === 'rarity') this.rarity = Number(item);
    else if (csvColumnName === 'damage') this.damage = Number(item);
    else if (csvColumnName === 'element') this.element = item;
    else throw new Error(`Unknown csv column name ${csvColumnName}`);
  }

  // to be ran after a csv import of all properties to ensure that all properties were correctly set on this entity
  private csvImportCheck() {
    if (
      this.id === undefined ||
      isNaN(this.id) ||
      !this.name ||
      !this.category ||
      this.rarity === undefined ||
      isNaN(this.rarity) ||
      this.damage === undefined ||
      isNaN(this.damage) ||
      !this.element
    )
      throw new Error(`Chip id ${this.id} from csv import contains missing or malformed properties`);
  }
}
