/**
 * Creates the first admin user. Run once after db:setup.
 * Default: phone=admin, password=admin123 (change immediately)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { randomUUID } from "crypto";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Set DATABASE_URL in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const check = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (check.rows.length > 0) {
    console.log("Admin user already exists.");
    await client.end();
    return;
  }

  const id = randomUUID();
  const hashed = await bcrypt.hash("admin123", 10);
  await client.query(
    `INSERT INTO users (id, name, phone, email, hashed_password, role)
     VALUES ($1, $2, $3, $4, $5, 'admin')`,
    [id, "Admin", "admin", "admin@local", hashed]
  );

  console.log("Admin user created.");
  console.log("  Phone: admin");
  console.log("  Password: admin123");
  console.log("  Change this password after first login!");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
