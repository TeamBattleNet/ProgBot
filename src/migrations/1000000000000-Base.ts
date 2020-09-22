/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { Chip } from '../models/chip';

export class Base1000000000000 implements MigrationInterface {
  name = 'Base1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chip" ("id" integer PRIMARY KEY NOT NULL, "name" varchar COLLATE NOCASE NOT NULL, "category" varchar NOT NULL, "rarity" integer NOT NULL, "damage" integer NOT NULL, "element" varchar NOT NULL)`
    );
    await queryRunner.query(`CREATE TABLE "literally" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "what" varchar COLLATE NOCASE NOT NULL, "clip" varchar NOT NULL)`);
    await queryRunner.query(
      `CREATE TABLE "quote" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "user" varchar COLLATE NOCASE NOT NULL, "quote" varchar COLLATE NOCASE NOT NULL, "date" varchar NOT NULL DEFAULT (''))`
    );
    await queryRunner.query(`CREATE TABLE "simple_command" ("cmd" varchar PRIMARY KEY NOT NULL, "reply" varchar NOT NULL)`);
    await queryRunner.query(
      `CREATE TABLE "twitch_channel" ("channel" varchar PRIMARY KEY NOT NULL, "disabledCommands" varchar NOT NULL, "minimumBrowseSeconds" integer NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "twitchUserId" varchar NOT NULL, "discordUserId" varchar NOT NULL, "zenny" integer NOT NULL DEFAULT (0), "bugfrags" integer NOT NULL DEFAULT (0), "battlechips" varchar NOT NULL DEFAULT ('{}'), "lastBrowseTime" datetime NOT NULL, "apiKey" varchar NOT NULL, "userClass" varchar NOT NULL DEFAULT ('user'), "linkToken" varchar, CONSTRAINT "UQ_912aa652018d98bd65940b50530" UNIQUE ("twitchUserId"), CONSTRAINT "UQ_eab11953198745b2e03be12ee56" UNIQUE ("discordUserId"), CONSTRAINT "UQ_b3c53c577ce390cb3a4550e6d9d" UNIQUE ("apiKey"))`
    );
    await Chip.csvChipDBImport(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "twitch_channel"`);
    await queryRunner.query(`DROP TABLE "simple_command"`);
    await queryRunner.query(`DROP TABLE "quote"`);
    await queryRunner.query(`DROP TABLE "literally"`);
    await queryRunner.query(`DROP TABLE "chip"`);
  }
}
/* eslint-enable */
