import { promises as fs } from 'node:fs';
import { Entity, PrimaryColumn, Column, BaseEntity, QueryRunner } from 'typeorm';
import type { ChipElement, ChipCategory } from '../types.js';

const DEFAULT_CHIPS_CSV = 'chips/chips.csv';

const VALID_CHIP_ELEMENTS = new Set<ChipElement>(['aqua', 'break', 'elec', 'fire', 'ground', 'invis', 'none', 'num', 'obj', 'recov', 'search', 'sword', 'wind', 'wood']);
const VALID_CHIP_CATEGORIES = new Set<ChipCategory>(['std', 'mega', 'navi', 'giga', 'dark']);

@Entity()
export class Chip extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ collation: 'NOCASE' })
  name: string;

  @Column()
  category: ChipCategory;

  @Column()
  rarity: number;

  @Column()
  damage: number;

  @Column()
  element: ChipElement;

  // Only public for testing purposes
  public static chipCache: { [id: string]: Chip | undefined } = {};

  // This should be called upon boot of the application
  // It will load the whole chip table from the db into memory for quick access
  public static async loadCache() {
    const allChips = await Chip.find();
    Chip.chipCache = {}; // first clear the cache
    allChips.forEach((chip) => (Chip.chipCache[chip.id] = chip));
  }

  public static getById(chipId: number | string) {
    const chip = Chip.chipCache[chipId];
    if (!chip) throw Error(`Requested invalid chip with id ${chipId}`);
    return chip;
  }

  // Can be used with migration file(s) via a provided queryRunner
  public static async csvChipDBImport(queryRunner: QueryRunner, chipsCSVFile = DEFAULT_CHIPS_CSV) {
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
    else if (csvColumnName === 'category') this.category = item as ChipCategory;
    else if (csvColumnName === 'rarity') this.rarity = Number(item);
    else if (csvColumnName === 'damage') this.damage = Number(item);
    else if (csvColumnName === 'element') this.element = item as ChipElement;
    else throw new Error(`Unknown csv column name ${csvColumnName}`);
  }

  // to be ran after a csv import of all properties to ensure that all properties were correctly set on this entity
  private csvImportCheck() {
    if (
      this.id === undefined ||
      isNaN(this.id) ||
      !this.name ||
      !this.category ||
      !VALID_CHIP_CATEGORIES.has(this.category) ||
      this.rarity === undefined ||
      isNaN(this.rarity) ||
      this.damage === undefined ||
      isNaN(this.damage) ||
      !this.element ||
      !VALID_CHIP_ELEMENTS.has(this.element)
    )
      throw new Error(`Chip id ${this.id} from csv import contains missing or malformed properties`);
  }
}
