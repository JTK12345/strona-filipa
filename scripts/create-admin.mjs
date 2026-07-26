import process from "node:process";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const emailArgumentIndex = process.argv.indexOf("--email");
const email =
  emailArgumentIndex >= 0
    ? process.argv[emailArgumentIndex + 1]?.trim().toLowerCase()
    : undefined;
const readsPasswordFromStdin = process.argv.includes("--password-stdin");

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Użycie: npm run db:create-admin -- --email admin@example.com --password-stdin");
  process.exit(1);
}

if (!readsPasswordFromStdin) {
  console.error("Hasło musi zostać przekazane przez standardowe wejście (--password-stdin).");
  process.exit(1);
}

let password = "";

for await (const chunk of process.stdin) {
  password += chunk;
}

password = password.replace(/[\r\n]+$/, "");

if (password.length < 10 || password.length > 128) {
  console.error("Hasło administratora musi mieć od 10 do 128 znaków.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Brak zmiennej DATABASE_URL.");
  process.exit(1);
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

  console.log(`Konto administratora ${email} jest gotowe.`);
} finally {
  await pool.end();
}
