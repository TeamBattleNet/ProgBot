const { Config } = require('./dist/clients/configuration');

module.exports = {
  // TODO change to better-sqlite3 on next typeorm release
  type: 'sqlite',
  database: Config.getConfig().database || 'runtime/progbot.db',
  synchronize: false,
  cache: true,
  entities: ['./dist/models/**/*.js'],
  migrations: ['./dist/migrations/**/*.js'],
  cli: { migrationsDir: 'src/migrations', entitiesDir: 'src/models' },
};
