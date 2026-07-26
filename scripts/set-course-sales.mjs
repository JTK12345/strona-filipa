import process from "node:process";
import pg from "pg";

const { Pool } = pg;

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const courseSlug = argument("course");
const enableSales = process.argv.includes("--enable");
const disableSales = process.argv.includes("--disable");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (
  !courseSlug ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseSlug) ||
  enableSales === disableSales
) {
  throw new Error(
    "Usage: --course <slug> followed by exactly one of --enable or --disable.",
  );
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });

try {
  const result = await pool.query(
    `UPDATE courses
     SET sales_enabled = $2,
         updated_at = now()
     WHERE slug = $1
       AND (
         $2::boolean = false
         OR (
           status = 'published'
           AND access_type = 'paid'
           AND price_cents IS NOT NULL
           AND price_cents > 0
         )
       )
     RETURNING slug, title, price_cents, currency, sales_enabled`,
    [courseSlug, enableSales],
  );
  const course = result.rows[0];

  if (!course) {
    throw new Error(
      "Course not found or it does not meet the requirements for enabled sales.",
    );
  }

  console.log(
    `${course.title}: sales_enabled=${course.sales_enabled}, price=${course.price_cents} ${course.currency.trim()}`,
  );
} finally {
  await pool.end();
}
