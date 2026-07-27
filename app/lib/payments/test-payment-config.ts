import "server-only";

import { canUseTestPayments } from "./test-payment-policy";

function getTestPaymentEnvironment() {
  return {
    TEST_PAYMENTS_ENABLED: process.env.TEST_PAYMENTS_ENABLED,
    TEST_PAYMENT_EMAILS: process.env.TEST_PAYMENT_EMAILS,
    P24_ENABLED: process.env.P24_ENABLED,
    P24_ENV: process.env.P24_ENV,
  };
}

export function isTestPaymentAllowed(email: string) {
  return canUseTestPayments(getTestPaymentEnvironment(), email);
}
