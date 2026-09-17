import bcrypt from "bcryptjs";

export function isStrongAdminPassword(password) {
  return (
    password.length >= 12 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/**
 * Creates the bootstrap account once. Existing accounts are deliberately
 * untouched: operational configuration must never reset credentials or roles.
 */
export async function createAdminIfMissing(pool, email, password) {
  const existing = await pool.query(
    "SELECT 1 FROM users WHERE lower(email) = $1 LIMIT 1",
    [email],
  );

  if (existing.rows[0]) {
    return { created: false };
  }

  if (!isStrongAdminPassword(password)) {
    throw new Error(
      "Administrator password must be 12-128 characters and include upper- and lowercase letters, a number, and a symbol.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const inserted = await pool.query(
    `INSERT INTO users (email, password_hash, role, status, email_verified_at)
     VALUES ($1, $2, 'admin', 'active', now())
     ON CONFLICT (lower(email)) DO NOTHING
     RETURNING id`,
    [email, passwordHash],
  );

  return { created: Boolean(inserted.rows[0]) };
}
