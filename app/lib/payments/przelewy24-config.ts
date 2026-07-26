export type P24Environment = "sandbox" | "production";

export type P24Config = {
  environment: P24Environment;
  merchantId: number;
  posId: number;
  apiKey: string;
  crc: string;
  appUrl: string;
  apiBaseUrl: string;
  paymentBaseUrl: string;
  timeoutMs: number;
};

type EnvironmentVariables = Record<string, string | undefined>;

const P24_SERVERS: Record<
  P24Environment,
  Pick<P24Config, "apiBaseUrl" | "paymentBaseUrl">
> = {
  sandbox: {
    apiBaseUrl: "https://sandbox.przelewy24.pl/api/v1",
    paymentBaseUrl: "https://sandbox.przelewy24.pl/trnRequest",
  },
  production: {
    apiBaseUrl: "https://secure.przelewy24.pl/api/v1",
    paymentBaseUrl: "https://secure.przelewy24.pl/trnRequest",
  },
};

export class P24ConfigurationError extends Error {
  constructor(
    public readonly code: "disabled" | "invalid",
    message: string,
  ) {
    super(message);
    this.name = "P24ConfigurationError";
  }
}

function requireSecret(
  env: EnvironmentVariables,
  name: "P24_API_KEY" | "P24_CRC",
) {
  const value = env[name]?.trim();

  if (!value) {
    throw new P24ConfigurationError(
      "invalid",
      `Missing required payment configuration: ${name}.`,
    );
  }

  return value;
}

function requirePositiveInteger(
  env: EnvironmentVariables,
  name: "P24_MERCHANT_ID" | "P24_POS_ID",
) {
  const rawValue = env[name]?.trim() ?? "";

  if (!/^[1-9]\d*$/.test(rawValue)) {
    throw new P24ConfigurationError(
      "invalid",
      `Payment configuration ${name} must be a positive integer.`,
    );
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value)) {
    throw new P24ConfigurationError(
      "invalid",
      `Payment configuration ${name} is outside the supported range.`,
    );
  }

  return value;
}

function readEnvironment(env: EnvironmentVariables): P24Environment {
  const value = env.P24_ENV?.trim() || "sandbox";

  if (value !== "sandbox" && value !== "production") {
    throw new P24ConfigurationError(
      "invalid",
      "P24_ENV must be either sandbox or production.",
    );
  }

  return value;
}

function readAppUrl(env: EnvironmentVariables, environment: P24Environment) {
  const rawValue = env.APP_URL?.trim();

  if (!rawValue) {
    throw new P24ConfigurationError(
      "invalid",
      "Missing required payment configuration: APP_URL.",
    );
  }

  let url: URL;

  try {
    url = new URL(rawValue);
  } catch {
    throw new P24ConfigurationError(
      "invalid",
      "APP_URL must be an absolute HTTP or HTTPS URL.",
    );
  }

  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";

  if (
    (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) ||
    (environment === "production" && url.protocol !== "https:")
  ) {
    throw new P24ConfigurationError(
      "invalid",
      "APP_URL must use HTTPS outside local Sandbox testing.",
    );
  }

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new P24ConfigurationError(
      "invalid",
      "APP_URL must contain only the public application origin.",
    );
  }

  return url.origin;
}

function readTimeout(env: EnvironmentVariables) {
  const rawValue = env.P24_HTTP_TIMEOUT_MS?.trim() || "8000";
  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 1000 || value > 30_000) {
    throw new P24ConfigurationError(
      "invalid",
      "P24_HTTP_TIMEOUT_MS must be an integer between 1000 and 30000.",
    );
  }

  return value;
}

export function isP24Enabled(env: EnvironmentVariables = process.env) {
  return env.P24_ENABLED?.trim().toLowerCase() === "true";
}

export function getP24Config(
  env: EnvironmentVariables = process.env,
): P24Config {
  if (!isP24Enabled(env)) {
    throw new P24ConfigurationError(
      "disabled",
      "Przelewy24 payments are disabled.",
    );
  }

  const environment = readEnvironment(env);

  return {
    environment,
    merchantId: requirePositiveInteger(env, "P24_MERCHANT_ID"),
    posId: requirePositiveInteger(env, "P24_POS_ID"),
    apiKey: requireSecret(env, "P24_API_KEY"),
    crc: requireSecret(env, "P24_CRC"),
    appUrl: readAppUrl(env, environment),
    timeoutMs: readTimeout(env),
    ...P24_SERVERS[environment],
  };
}
