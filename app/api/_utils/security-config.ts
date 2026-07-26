const DEFAULT_ALLOWED_DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseCsvEnv(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase();
}

export function isLocalHost(host: string) {
  const normalizedHost = normalizeHost(host);

  try {
    const hostname = new URL(`http://${normalizedHost}`).hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export const securityConfig = {
  allowedOrigins: (() => {
    const configured = parseCsvEnv(process.env.ALLOWED_ORIGINS).map(normalizeOrigin).filter(Boolean);

    if (configured.length > 0) {
      return configured;
    }

    if (process.env.NODE_ENV !== "production") {
      return DEFAULT_ALLOWED_DEV_ORIGINS;
    }

    return [];
  })(),
  trustedProxySecret: process.env.TRUSTED_PROXY_SECRET?.trim() ?? "",
  logSalt: process.env.LOG_SALT?.trim() || "local-log-salt-change-me",
  bodyLimitBytes: 10 * 1024,
  requestTimeoutMs: 8_000,
  verificationTimeoutMs: 5_000,
  smtpTimeoutMs: 10_000,
  rateLimitWindowMs: 10 * 60 * 1000,
  endpointRateLimit: 5,
  globalRateLimit: 10,
};

export function getAllowedHosts() {
  return securityConfig.allowedOrigins
    .map((origin) => {
      try {
        return normalizeHost(new URL(origin).host);
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

export function isDevelopmentHost(host: string) {
  return isLocalHost(host);
}

export function isAllowedOrigin(origin: string) {
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  if (securityConfig.allowedOrigins.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return securityConfig.allowedOrigins.includes(normalizedOrigin);
}

export function isAllowedHost(host: string) {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return false;
  }

  if (securityConfig.allowedOrigins.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return getAllowedHosts().includes(normalizedHost);
}
