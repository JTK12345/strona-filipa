import process from "node:process";
import pg from "pg";
import { createAdminIfMissing } from "./admin-bootstrap.mjs";

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

if (!process.env.DATABASE_URL) {
  console.error("Brak zmiennej DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

try {
  const result = await createAdminIfMissing(pool, email, password);
  console.log(
    result.created
      ? "Konto administratora zostało utworzone."
      : "Konto administratora już istnieje; nie wprowadzono zmian.",
  );
} catch (error) {
  if (error instanceof Error && error.message.startsWith("Administrator password")) {
    console.error("Hasło administratora musi mieć 12-128 znaków oraz małą i wielką literę, cyfrę i symbol.");
    process.exitCode = 1;
  } else {
    throw error;
  }
} finally {
  await pool.end();
}
