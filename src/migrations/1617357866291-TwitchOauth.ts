/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class TwitchOauth1617357866291 implements MigrationInterface {
  name = 'TwitchOauth1617357866291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_twitch_channel" ("channel" varchar PRIMARY KEY NOT NULL, "disabledCommands" varchar NOT NULL, "minimumBrowseSeconds" integer NOT NULL DEFAULT (0), "channelPointsIntegration" boolean NOT NULL DEFAULT (0), "oauthTokenState" varchar, "accessToken" varchar, "refreshToken" varchar)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_twitch_channel"("channel", "disabledCommands", "minimumBrowseSeconds") SELECT "channel", "disabledCommands", "minimumBrowseSeconds" FROM "twitch_channel"`
    );
    await queryRunner.query(`DROP TABLE "twitch_channel"`);
    await queryRunner.query(`ALTER TABLE "temporary_twitch_channel" RENAME TO "twitch_channel"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "twitch_channel" RENAME TO "temporary_twitch_channel"`);
    await queryRunner.query(
      `CREATE TABLE "twitch_channel" ("channel" varchar PRIMARY KEY NOT NULL, "disabledCommands" varchar NOT NULL, "minimumBrowseSeconds" integer NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `INSERT INTO "twitch_channel"("channel", "disabledCommands", "minimumBrowseSeconds") SELECT "channel", "disabledCommands", "minimumBrowseSeconds" FROM "temporary_twitch_channel"`
    );
    await queryRunner.query(`DROP TABLE "temporary_twitch_channel"`);
  }
}
/* eslint-enable */
