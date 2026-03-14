/**
 * Creates the recycle_app database if it doesn't exist.
 * Connect to PostgreSQL default DB (postgres). Set DATABASE_BASE_URL in .env:
 * DATABASE_BASE_URL=postgresql://user:password@host:5432/database
 */
import "dotenv/config";
import { Client } from "pg";

const DB_NAME = "recycle_app";

async function main() {
  const baseUrl = process.env.DATABASE_BASE_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    console.error("Set DATABASE_BASE_URL or DATABASE_URL in .env");
    console.error("Example: postgresql://user:password@host:5432/database");
    process.exit(1);
  }

  // Connect to default 'postgres' database to create our app database
  const baseClient = new Client({ connectionString: baseUrl });
  try {
    await baseClient.connect();
  } catch (err) {
    console.error("Could not connect to PostgreSQL. Is it running?");
    console.error(err);
    process.exit(1);
  }

  const result = await baseClient.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [DB_NAME]
  );
  if (result.rows.length > 0) {
    console.log(`Database "${DB_NAME}" already exists.`);
    await baseClient.end();
    return;
  }

  await baseClient.query(`CREATE DATABASE ${DB_NAME}`);
  console.log(`Database "${DB_NAME}" created.`);
  await baseClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
