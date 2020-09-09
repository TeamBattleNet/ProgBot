const { SQL_DATABASE } = process.env;
module.exports = [{
  name: 'default',
  // TODO change to better-sqlite3 on next typeorm release
  type: 'sqlite',
  database: SQL_DATABASE || 'runtime/progbot.db',
  synchronize: false,
  cache: true,
  entities: ['./dist/models/**/*.js'],
  migrations: ['./dist/migrations/**/*.js'],
  cli: { migrationsDir: 'src/migrations', entitiesDir: 'src/models' },
}];
