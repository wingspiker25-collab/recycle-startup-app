import "dotenv/config";
import { Client } from "pg";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Set DATABASE_URL in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE");
    console.log("Added username column to users table");

    await client.query(`CREATE TABLE IF NOT EXISTS otps (
      id UUID PRIMARY KEY,
      email_or_phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    console.log("Created otps table");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

migrate();