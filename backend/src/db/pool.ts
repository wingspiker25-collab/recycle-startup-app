import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : false,
});