import { isLocalHost, securityConfig } from "@/app/api/_utils/security-config";

export class PasswordResetUrlConfigError extends Error {
  constructor() {
    super("Password reset URL configuration is invalid.");
    this.name = "PasswordResetUrlConfigError";
  }
}

type PasswordResetUrlOptions = {
  appUrl?: string;
  isProduction?: boolean;
  allowedOrigins?: readonly string[];
};

export function getPublicAppBaseUrl(
  request: Request,
  options: PasswordResetUrlOptions = {},
) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";
  const configured = options.appUrl?.trim() ?? process.env.APP_URL?.trim();
  const allowedOrigins = options.allowedOrigins ?? securityConfig.allowedOrigins;

  if (configured) {
    let url: URL;
    try {
      url = new URL(configured);
    } catch {
      throw new PasswordResetUrlConfigError();
    }

    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      (isProduction && url.protocol !== "https:") ||
      !allowedOrigins.includes(url.origin)
    ) {
      throw new PasswordResetUrlConfigError();
    }

    return url.origin;
  }

  if (isProduction) {
    throw new PasswordResetUrlConfigError();
  }

  const requestUrl = new URL(request.url);
  if (isLocalHost(requestUrl.host)) {
    return requestUrl.origin;
  }

  return "http://localhost:3000";
}

/** @deprecated Use getPublicAppBaseUrl for new public authentication links. */
export const getPasswordResetBaseUrl = getPublicAppBaseUrl;
