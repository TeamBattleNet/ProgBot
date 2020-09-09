/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { Chip } from '../models/chip';

export class Base1000000000000 implements MigrationInterface {
  name = 'Base1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chip" ("id" integer PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "category" varchar NOT NULL, "rarity" integer NOT NULL, "damage" integer NOT NULL, "element" varchar NOT NULL)`
    );
    await queryRunner.query(
      `CREATE TABLE "query-result-cache" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "identifier" varchar, "time" bigint NOT NULL, "duration" integer NOT NULL, "query" text NOT NULL, "result" text NOT NULL)`
    );
    await Chip.csvChipDBImport(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "query-result-cache"`);
    await queryRunner.query(`DROP TABLE "chip"`);
  }
}
/* eslint-enable */
