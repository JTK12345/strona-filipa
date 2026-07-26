import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to check the database.");
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });

try {
  const migrations = await pool.query(
    "SELECT version, applied_at FROM schema_migrations ORDER BY version",
  );
  const tables = await pool.query(`
    SELECT count(*)::integer AS count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

  console.log(`Database connected. Tables: ${tables.rows[0].count}`);
  for (const migration of migrations.rows) {
    console.log(`Applied: ${migration.version} (${migration.applied_at.toISOString()})`);
  }
} finally {
  await pool.end();
}
