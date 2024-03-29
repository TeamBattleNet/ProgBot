import { DataSource } from 'typeorm';
import { Config } from './configuration.js';

const DatabaseDataSource = new DataSource({
  type: 'better-sqlite3',
  database: Config.getConfig().database || 'runtime/progbot.db',
  synchronize: false,
  entities: ['dist/models/**/*.js'],
  migrations: ['dist/migrations/**/*.js'],
  // logging: 'all',
});

class Database {
  public static datasource: DataSource;

  // Must be called before other methods (on startup)
  public static async initialize() {
    this.datasource = DatabaseDataSource;
    await Database.datasource.initialize();
  }

  public static async shutdown() {
    await Database.datasource.destroy();
  }
}

export { Database, DatabaseDataSource };
