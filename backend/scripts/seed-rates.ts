/**
 * Seeds default scrap rate categories. Run after db:seed (admin must exist).
 */
import "dotenv/config";
import { Client } from "pg";
import { randomUUID } from "crypto";

const DEFAULT_RATES: [string, number][] = [
  ["iron", 25],
  ["copper", 80],
  ["aluminium", 50],
  ["paper", 8],
  ["plastic", 12],
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Set DATABASE_URL in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const admin = (await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")).rows[0];
  if (!admin) {
    console.error("Run npm run db:seed first to create admin user.");
    await client.end();
    process.exit(1);
  }

  for (const [category, rate] of DEFAULT_RATES) {
    const exists = (await client.query("SELECT 1 FROM scrap_rates WHERE category = $1 LIMIT 1", [category])).rows[0];
    if (!exists) {
      await client.query(
        `INSERT INTO scrap_rates (id, category, rate_per_kg, created_by_admin_id) VALUES ($1, $2, $3, $4)`,
        [randomUUID(), category, rate, admin.id]
      );
      console.log(`Added rate: ${category} = ₹${rate}/kg`);
    }
  }
  console.log("Scrap rates seeded.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
