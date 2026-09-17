import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const sessionDurationSeconds = 60 * 60 * 24 * 30;

export function getSessionCookieName(isProduction: boolean) {
  // __Host- requires Secure, Path=/, and no Domain attribute. This protects the
  // production cookie from being shadowed by a subdomain.
  return isProduction ? "__Host-spc_session" : "spc_session";
}

export function createSessionCookie(
  token: string,
  isProduction: boolean,
): ResponseCookie {
  return {
    name: getSessionCookieName(isProduction),
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    path: "/",
    maxAge: sessionDurationSeconds,
  };
}

export function clearSessionCookie(isProduction: boolean): ResponseCookie {
  return {
    name: getSessionCookieName(isProduction),
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    path: "/",
    maxAge: 0,
  };
}
