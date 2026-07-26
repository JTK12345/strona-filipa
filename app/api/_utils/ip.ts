import { isIP } from "node:net";
import {
  isLocalHost,
  securityConfig,
} from "@/app/api/_utils/security-config";

export type ClientIpResult = {
  ip: string;
  isTrustedProxy: boolean;
  source: "x-forwarded-for" | "x-real-ip" | "local-dev" | "unknown";
};

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const innerValue = trimmed.slice(1, -1);
    return isIP(innerValue) ? innerValue : "";
  }

  const ipv4WithPortMatch = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);

  if (ipv4WithPortMatch) {
    return isIP(ipv4WithPortMatch[1]) ? ipv4WithPortMatch[1] : "";
  }

  return isIP(trimmed) ? trimmed : "";
}

function parseForwardedFor(headerValue: string | null) {
  if (!headerValue) {
    return [];
  }

  return headerValue
    .split(",")
    .map(normalizeIpCandidate)
    .filter(Boolean);
}

function isTrustedProxyRequest(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    const host = request.headers.get("host") ?? "";
    if (isLocalHost(host)) {
      return true;
    }
  }

  const trustedSecret = securityConfig.trustedProxySecret;
  if (trustedSecret) {
    const providedSecret = request.headers.get("x-trusted-proxy-secret")?.trim();
    if (providedSecret === trustedSecret) {
      return true;
    }
  }

  return false;
}

export function isValidIp(value: string) {
  return normalizeIpCandidate(value) !== "";
}

export function getClientIp(request: Request): ClientIpResult {
  const forwardedChain = parseForwardedFor(request.headers.get("x-forwarded-for"));
  const trustedProxy = isTrustedProxyRequest(request);

  if (process.env.NODE_ENV !== "production") {
    const host = request.headers.get("host") ?? "";
    if (isLocalHost(host)) {
      return {
        ip: forwardedChain[0] ?? "127.0.0.1",
        isTrustedProxy: true,
        source: "local-dev",
      };
    }
  }

  if (trustedProxy) {
    const realIp = normalizeIpCandidate(request.headers.get("x-real-ip") ?? "");
    if (realIp) {
      return {
        ip: realIp,
        isTrustedProxy: true,
        source: "x-real-ip",
      };
    }

    if (forwardedChain[0]) {
      return {
        ip: forwardedChain[0],
        isTrustedProxy: true,
        source: "x-forwarded-for",
      };
    }
  }

  return {
    ip: "unknown",
    isTrustedProxy: false,
    source: "unknown",
  };
}
