const { Config } = require('./dist/clients/configuration');

module.exports = {
  type: 'better-sqlite3',
  database: Config.getConfig().database || 'runtime/progbot.db',
  synchronize: false,
  cache: true,
  entities: ['./dist/models/**/*.js'],
  migrations: ['./dist/migrations/**/*.js'],
  cli: { migrationsDir: 'src/migrations', entitiesDir: 'src/models' },
};
