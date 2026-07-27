type TestPaymentEnvironment = {
  TEST_PAYMENTS_ENABLED?: string;
  TEST_PAYMENT_EMAILS?: string;
  P24_ENABLED?: string;
  P24_ENV?: string;
};

function parseAllowedEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function canUseTestPayments(
  environment: TestPaymentEnvironment,
  email: string,
) {
  const allowedEmails = parseAllowedEmails(
    environment.TEST_PAYMENT_EMAILS,
  );

  return (
    environment.TEST_PAYMENTS_ENABLED === "true" &&
    environment.P24_ENABLED !== "true" &&
    environment.P24_ENV !== "production" &&
    allowedEmails.includes(email.trim().toLowerCase())
  );
}
