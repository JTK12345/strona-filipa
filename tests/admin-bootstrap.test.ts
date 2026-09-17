import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminIfMissing,
  isStrongAdminPassword,
} from "../scripts/admin-bootstrap.mjs";

test("administrator bootstrap does not overwrite an existing account", async () => {
  const queries: Array<{ text: string; values?: unknown[] }> = [];
  const pool = {
    async query(text: string, values?: unknown[]) {
      queries.push({ text, values });
      return { rows: [{ id: "existing-user" }] };
    },
  };

  const result = await createAdminIfMissing(
    pool,
    "admin@example.com",
    "A-strong-password-1!",
  );

  assert.deepEqual(result, { created: false });
  assert.equal(queries.length, 1);
  assert.match(queries[0].text, /SELECT 1 FROM users/i);
  assert.doesNotMatch(queries[0].text, /UPDATE users/i);
});

test("administrator bootstrap inserts once with conflict-safe SQL", async () => {
  const queries: Array<{ text: string; values?: unknown[] }> = [];
  const pool = {
    async query(text: string, values?: unknown[]) {
      queries.push({ text, values });
      return { rows: queries.length === 1 ? [] : [{ id: "new-user" }] };
    },
  };

  const result = await createAdminIfMissing(
    pool,
    "admin@example.com",
    "A-strong-password-1!",
  );

  assert.deepEqual(result, { created: true });
  assert.equal(queries.length, 2);
  assert.match(queries[1].text, /ON CONFLICT \(lower\(email\)\) DO NOTHING/i);
  assert.doesNotMatch(queries[1].text, /DO UPDATE/i);
  assert.notEqual(queries[1].values?.[1], "A-strong-password-1!");
});

test("administrator bootstrap requires a strong first password", () => {
  assert.equal(isStrongAdminPassword("short"), false);
  assert.equal(isStrongAdminPassword("alllowercasepassword1!"), false);
  assert.equal(isStrongAdminPassword("A-strong-password-1!"), true);
});

test("administrator bootstrap rejects a weak password only when creation is needed", async () => {
  const emptyPool = {
    async query() {
      return { rows: [] };
    },
  };
  const existingPool = {
    async query() {
      return { rows: [{ id: "existing-user" }] };
    },
  };

  await assert.rejects(
    createAdminIfMissing(emptyPool, "admin@example.com", "weak"),
    /Administrator password/,
  );
  assert.deepEqual(
    await createAdminIfMissing(existingPool, "admin@example.com", "weak"),
    { created: false },
  );
});
