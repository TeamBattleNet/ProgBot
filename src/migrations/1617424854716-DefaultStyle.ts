/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultStyle1617424854716 implements MigrationInterface {
  name = 'DefaultStyle1617424854716';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "twitchUserId" varchar NOT NULL, "discordUserId" varchar NOT NULL, "apiKey" varchar NOT NULL, "userClass" varchar NOT NULL DEFAULT ('user'), "linkToken" varchar, "zenny" integer NOT NULL DEFAULT (0), "bugfrags" integer NOT NULL DEFAULT (0), "battlechips" varchar NOT NULL DEFAULT ('{}'), "lastBrowseTime" datetime NOT NULL, "style" varchar, CONSTRAINT "UQ_912aa652018d98bd65940b50530" UNIQUE ("twitchUserId"), CONSTRAINT "UQ_eab11953198745b2e03be12ee56" UNIQUE ("discordUserId"), CONSTRAINT "UQ_b3c53c577ce390cb3a4550e6d9d" UNIQUE ("apiKey"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime", "style") SELECT "id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime", "style" FROM "user"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "twitchUserId" varchar NOT NULL, "discordUserId" varchar NOT NULL, "apiKey" varchar NOT NULL, "userClass" varchar NOT NULL DEFAULT ('user'), "linkToken" varchar, "zenny" integer NOT NULL DEFAULT (0), "bugfrags" integer NOT NULL DEFAULT (0), "battlechips" varchar NOT NULL DEFAULT ('{}'), "lastBrowseTime" datetime NOT NULL, "style" varchar NOT NULL DEFAULT ('Normal Style'), CONSTRAINT "UQ_912aa652018d98bd65940b50530" UNIQUE ("twitchUserId"), CONSTRAINT "UQ_eab11953198745b2e03be12ee56" UNIQUE ("discordUserId"), CONSTRAINT "UQ_b3c53c577ce390cb3a4550e6d9d" UNIQUE ("apiKey"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime") SELECT "id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime" FROM "user"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "twitchUserId" varchar NOT NULL, "discordUserId" varchar NOT NULL, "apiKey" varchar NOT NULL, "userClass" varchar NOT NULL DEFAULT ('user'), "linkToken" varchar, "zenny" integer NOT NULL DEFAULT (0), "bugfrags" integer NOT NULL DEFAULT (0), "battlechips" varchar NOT NULL DEFAULT ('{}'), "lastBrowseTime" datetime NOT NULL, "style" varchar, CONSTRAINT "UQ_912aa652018d98bd65940b50530" UNIQUE ("twitchUserId"), CONSTRAINT "UQ_eab11953198745b2e03be12ee56" UNIQUE ("discordUserId"), CONSTRAINT "UQ_b3c53c577ce390cb3a4550e6d9d" UNIQUE ("apiKey"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime", "style") SELECT "id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime", "style" FROM "temporary_user"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "twitchUserId" varchar NOT NULL, "discordUserId" varchar NOT NULL, "apiKey" varchar NOT NULL, "userClass" varchar NOT NULL DEFAULT ('user'), "linkToken" varchar, "zenny" integer NOT NULL DEFAULT (0), "bugfrags" integer NOT NULL DEFAULT (0), "battlechips" varchar NOT NULL DEFAULT ('{}'), "lastBrowseTime" datetime NOT NULL, "style" varchar, CONSTRAINT "UQ_912aa652018d98bd65940b50530" UNIQUE ("twitchUserId"), CONSTRAINT "UQ_eab11953198745b2e03be12ee56" UNIQUE ("discordUserId"), CONSTRAINT "UQ_b3c53c577ce390cb3a4550e6d9d" UNIQUE ("apiKey"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime", "style") SELECT "id", "twitchUserId", "discordUserId", "apiKey", "userClass", "linkToken", "zenny", "bugfrags", "battlechips", "lastBrowseTime", "style" FROM "temporary_user"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
  }
}
/* eslint-enable */
