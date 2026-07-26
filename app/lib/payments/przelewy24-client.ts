import {
  createP24RegistrationSign,
  createP24VerificationSign,
} from "./przelewy24-signatures";
import type { P24Config } from "./przelewy24-config";
import { LosslessNumber, stringify as losslessStringify } from "lossless-json";

type FetchImplementation = typeof fetch;

export type P24RegistrationInput = {
  sessionId: string;
  amount: number;
  currency: "PLN";
  description: string;
  email: string;
  urlReturn: string;
  urlStatus: string;
};

export type P24VerificationInput = {
  sessionId: string;
  amount: number;
  currency: "PLN";
  orderId: string;
};

export class P24ApiError extends Error {
  constructor(
    public readonly code:
      | "timeout"
      | "network"
      | "provider"
      | "invalid_response",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "P24ApiError";
  }
}

function assertText(value: string, field: string, maxLength: number) {
  if (!value || value.length > maxLength) {
    throw new TypeError(
      `${field} must contain between 1 and ${maxLength} characters.`,
    );
  }
}

function assertNonNegativeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative safe integer.`);
  }
}

function assertHttpsOrLocalUrl(value: string, field: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${field} must be an absolute URL.`);
  }

  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";

  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new TypeError(`${field} must use HTTPS outside local testing.`);
  }
}

function validateRegistration(input: P24RegistrationInput) {
  assertText(input.sessionId, "sessionId", 100);
  assertNonNegativeInteger(input.amount, "amount");
  assertText(input.description, "description", 1024);
  assertText(input.email, "email", 50);
  assertHttpsOrLocalUrl(input.urlReturn, "urlReturn");
  assertHttpsOrLocalUrl(input.urlStatus, "urlStatus");
}

function validateVerification(input: P24VerificationInput) {
  assertText(input.sessionId, "sessionId", 100);
  assertNonNegativeInteger(input.amount, "amount");

  if (
    !/^(0|[1-9]\d*)$/.test(input.orderId) ||
    BigInt(input.orderId) > BigInt("9223372036854775807")
  ) {
    throw new TypeError("orderId must be an unsigned 64-bit integer.");
  }
}

function parseJsonResponse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new P24ApiError(
      "invalid_response",
      "Przelewy24 returned an invalid response.",
    );
  }
}

export class Przelewy24Client {
  constructor(
    private readonly config: P24Config,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  private async request(path: string, init: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs,
    );
    const authorization = Buffer.from(
      `${this.config.posId}:${this.config.apiKey}`,
      "utf8",
    ).toString("base64");

    try {
      const response = await this.fetchImplementation(
        `${this.config.apiBaseUrl}${path}`,
        {
          ...init,
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${authorization}`,
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers,
          },
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const body = await response.text();

      if (!response.ok) {
        throw new P24ApiError(
          "provider",
          "Przelewy24 rejected the request.",
          response.status,
        );
      }

      return parseJsonResponse(body);
    } catch (error) {
      if (error instanceof P24ApiError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new P24ApiError(
          "timeout",
          "Przelewy24 did not respond before the timeout.",
        );
      }

      throw new P24ApiError(
        "network",
        "Could not connect to Przelewy24.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async testAccess() {
    const result = await this.request("/testAccess");

    if (
      typeof result !== "object" ||
      result === null ||
      !("data" in result) ||
      result.data !== true
    ) {
      throw new P24ApiError(
        "invalid_response",
        "Przelewy24 did not confirm API access.",
      );
    }

    return true;
  }

  async registerTransaction(input: P24RegistrationInput) {
    validateRegistration(input);

    const result = await this.request("/transaction/register", {
      method: "POST",
      body: JSON.stringify({
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId: input.sessionId,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        email: input.email,
        country: "PL",
        language: "pl",
        urlReturn: input.urlReturn,
        urlStatus: input.urlStatus,
        timeLimit: 15,
        regulationAccept: false,
        sign: createP24RegistrationSign(
          {
            sessionId: input.sessionId,
            merchantId: this.config.merchantId,
            amount: input.amount,
            currency: input.currency,
          },
          this.config.crc,
        ),
      }),
    });

    const token =
      typeof result === "object" &&
      result !== null &&
      "data" in result &&
      typeof result.data === "object" &&
      result.data !== null &&
      "token" in result.data &&
      typeof result.data.token === "string"
        ? result.data.token
        : "";

    if (!token || token.length > 200) {
      throw new P24ApiError(
        "invalid_response",
        "Przelewy24 returned an invalid transaction token.",
      );
    }

    return { token };
  }

  async verifyTransaction(input: P24VerificationInput) {
    validateVerification(input);

    const result = await this.request("/transaction/verify", {
      method: "PUT",
      body: losslessStringify({
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId: input.sessionId,
        amount: input.amount,
        currency: input.currency,
        orderId: new LosslessNumber(input.orderId),
        sign: createP24VerificationSign(
          {
            sessionId: input.sessionId,
            orderId: input.orderId,
            amount: input.amount,
            currency: input.currency,
          },
          this.config.crc,
        ),
      }),
    });

    const status =
      typeof result === "object" &&
      result !== null &&
      "data" in result &&
      typeof result.data === "object" &&
      result.data !== null &&
      "status" in result.data
        ? result.data.status
        : undefined;

    if (status !== "success") {
      throw new P24ApiError(
        "invalid_response",
        "Przelewy24 did not verify the transaction.",
      );
    }

    return true;
  }

  getPaymentUrl(token: string) {
    assertText(token, "token", 200);
    return `${this.config.paymentBaseUrl}/${encodeURIComponent(token)}`;
  }
}
