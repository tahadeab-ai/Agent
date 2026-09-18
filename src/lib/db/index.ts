import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }
  if (!client) {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Recommended for Neon Serverless / connection poolers
    });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

// Proxy export for direct db usage with graceful fallback
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const database = getDb();
    if (!database) {
      throw new Error('Database is not configured. POSTGRES_URL environment variable is missing.');
    }
    return (database as any)[prop];
  },
});

export * from './schema';
