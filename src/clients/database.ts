import { createConnection, getConnectionOptions, Connection } from 'typeorm';

export class Database {
  public static connection: Connection; // Only public for testing. Not to be used directly outside of this class

  // Must be called before other methods (on startup)
  public static async initialize() {
    const connectionOptions = await getConnectionOptions();
    Database.connection = await createConnection(connectionOptions);
  }

  public static async shutdown() {
    await Database.connection.close();
  }
}
