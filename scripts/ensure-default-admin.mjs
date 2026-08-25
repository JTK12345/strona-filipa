import process from "node:process";
import bcrypt from "bcryptjs";
import pg from "pg";

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

if (password.length < 8 || password.length > 128) {
  throw new Error(
    "DEFAULT_ADMIN_PASSWORD must be set in .env and have 8 to 128 characters.",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

try {
  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (email, password_hash, role, status, email_verified_at)
     VALUES ($1, $2, 'admin', 'active', now())
     ON CONFLICT (lower(email))
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       status = 'active',
       email_verified_at = COALESCE(users.email_verified_at, now()),
       updated_at = now()`,
    [email, passwordHash],
  );

  console.log(`Default admin account is ready: ${email}`);
} finally {
  await pool.end();
}
