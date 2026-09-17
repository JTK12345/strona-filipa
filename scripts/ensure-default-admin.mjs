import process from "node:process";
import pg from "pg";
import { createAdminIfMissing } from "./admin-bootstrap.mjs";

const { Pool } = pg;

const defaultAdminEmail = "admin@example.com";
const email = (process.env.DEFAULT_ADMIN_EMAIL || defaultAdminEmail)
  .trim()
  .toLowerCase();
const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim() ?? "";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to ensure the default admin.");
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("DEFAULT_ADMIN_EMAIL must be a valid email address.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

try {
  const result = await createAdminIfMissing(pool, email, password);
  console.log(
    result.created
      ? "Default administrator account created."
      : "Default administrator already exists; no changes made.",
  );
} finally {
  await pool.end();
}
