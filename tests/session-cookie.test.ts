import assert from "node:assert/strict";
import test from "node:test";
import {
  clearSessionCookie,
  createSessionCookie,
  getSessionCookieName,
} from "../app/lib/session-cookie";

test("production session cookies use __Host- and strict secure attributes", () => {
  const cookie = createSessionCookie("token", true);
  assert.equal(cookie.name, "__Host-spc_session");
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.secure, true);
  assert.equal(cookie.sameSite, "strict");
  assert.equal(cookie.path, "/");
  assert.ok((cookie.maxAge ?? 0) > 0);
  assert.equal(getSessionCookieName(false), "spc_session");
});

test("logout cookie clearing preserves the matching cookie attributes", () => {
  const cookie = clearSessionCookie(true);
  assert.equal(cookie.name, "__Host-spc_session");
  assert.equal(cookie.maxAge, 0);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.secure, true);
  assert.equal(cookie.path, "/");
});
