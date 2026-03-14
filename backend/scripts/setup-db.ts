/**
 * Runs schema.sql to create all tables in the database.
 * Requires DATABASE_URL to point to your app database, e.g.:
 * DATABASE_URL=postgres://user:password@localhost:5432/recycle_app
 */
import "dotenv/config";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Set DATABASE_URL in .env");
    console.error("Example: postgres://postgres:password@localhost:5432/recycle_app");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
  } catch (err) {
    console.error("Could not connect to the database. Ensure it exists and PostgreSQL is running.");
    console.error("Create it with: npm run db:create");
    console.error(err);
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, "..", "src", "models", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  await client.query(sql);
  console.log("Schema applied successfully. Tables created.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
