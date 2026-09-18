import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export async function runMigrations() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.log('[DB] Skipping migrations: POSTGRES_URL is not set.');
    return;
  }
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  try {
    console.log('[DB] Running migrations from ./drizzle...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[DB] Migrations completed successfully.');
  } catch (err) {
    console.error('[DB] Migration failed:', err);
  } finally {
    await sql.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
