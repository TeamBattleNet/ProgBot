import { createConnection, getConnectionOptions, Connection } from 'typeorm';

export class Database {
  public static connection: Connection;

  // Must be called before other methods (on startup)
  public static async initialize() {
    const connectionOptions = await getConnectionOptions();
    Database.connection = await createConnection(connectionOptions);
  }

  public static async shutdown() {
    await Database.connection.close();
  }
}
