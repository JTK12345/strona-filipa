import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const migrationsDirectory = path.join(process.cwd(), "database", "migrations");
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});
const client = await pool.connect();

function checksum(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

try {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [
    "strona_filipa_database_migrations",
  ]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
    const fileChecksum = checksum(sql);
    const applied = await client.query(
      "SELECT checksum FROM schema_migrations WHERE version = $1",
      [file],
    );

    if (applied.rowCount) {
      if (applied.rows[0].checksum !== fileChecksum) {
        throw new Error(`Applied migration ${file} has a different checksum.`);
      }

      console.log(`Database migration already applied: ${file}`);
      continue;
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
        [file, fileChecksum],
      );
      await client.query("COMMIT");
      console.log(`Database migration applied: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(hashtext($1))", [
    "strona_filipa_database_migrations",
  ]).catch(() => undefined);
  client.release();
  await pool.end();
}
