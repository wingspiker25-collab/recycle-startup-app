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

  const check = await client.query("SELECT id, username FROM users WHERE role = 'admin' LIMIT 1");
  if (check.rows.length > 0) {
    const admin = check.rows[0];
    if (!admin.username) {
      // Update existing admin to add username
      await client.query(
        "UPDATE users SET username = $1 WHERE id = $2",
        ["reforge", admin.id]
      );
      console.log("Updated existing admin user with username 'reforge'.");
    } else {
      console.log("Admin user already exists with username:", admin.username);
    }
    await client.end();
    return;
  }

  const id = randomUUID();
  const hashed = await bcrypt.hash("vinoth2486@", 10);
  await client.query(
    `INSERT INTO users (id, name, phone, email, username, hashed_password, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'admin')`,
    [id, "Admin", "admin", "admin@local", "reforge", hashed]
  );

  console.log("Admin user created.");
  console.log("  Username: reforge");
  console.log("  Password: vinoth2486@");
  console.log("  Change this password after first login!");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
