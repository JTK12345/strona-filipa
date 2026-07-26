import type {
  P24RegistrationInput,
} from "./przelewy24-client";

export type PendingCoursePurchase = {
  purchaseId: string;
  publicOrderNumber: string;
  providerSessionId: string;
  buyerEmail: string;
  courseId: string;
  courseTitle: string;
  amountCents: number;
  currency: "PLN";
};

export type CreatePendingPurchaseInput = {
  userId: string;
  buyerEmail: string;
  courseId: string;
  providerSessionId: string;
  publicOrderNumber: string;
};

export type CheckoutRepository = {
  createPendingPurchase(
    input: CreatePendingPurchaseInput,
  ): Promise<PendingCoursePurchase>;
  markPurchaseRegistered(
    purchaseId: string,
    providerToken: string,
  ): Promise<void>;
  markPurchaseRegistrationFailed(
    purchaseId: string,
    reason: string,
  ): Promise<void>;
};

export type CheckoutPaymentGateway = {
  registerTransaction(
    input: P24RegistrationInput,
  ): Promise<{ token: string }>;
  getPaymentUrl(token: string): string;
};

export type CheckoutIdentifiers = {
  providerSessionId: string;
  publicOrderNumber: string;
};

export class CheckoutError extends Error {
  constructor(
    public readonly code:
      | "invalid_course"
      | "course_unavailable"
      | "already_owned"
      | "provider_unavailable",
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

function assertCourseId(courseId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      courseId,
    )
  ) {
    throw new CheckoutError("invalid_course", "Invalid course identifier.");
  }
}

export async function createCourseCheckout(
  input: {
    userId: string;
    email: string;
    role: "user" | "admin";
    courseId: string;
    appUrl: string;
  },
  dependencies: {
    repository: CheckoutRepository;
    gateway: CheckoutPaymentGateway;
    createIdentifiers: () => CheckoutIdentifiers;
  },
) {
  assertCourseId(input.courseId);

  if (input.role === "admin") {
    throw new CheckoutError(
      "already_owned",
      "Administrators already have access to all courses.",
    );
  }

  if (input.email.length > 50) {
    throw new CheckoutError(
      "provider_unavailable",
      "The account email is too long for the payment provider.",
    );
  }

  const identifiers = dependencies.createIdentifiers();
  const purchase = await dependencies.repository.createPendingPurchase({
    userId: input.userId,
    buyerEmail: input.email,
    courseId: input.courseId,
    ...identifiers,
  });

  let registration: { token: string };

  try {
    registration = await dependencies.gateway.registerTransaction({
      sessionId: purchase.providerSessionId,
      amount: purchase.amountCents,
      currency: purchase.currency,
      description: `Profil Ciala - ${purchase.courseTitle}`,
      email: purchase.buyerEmail,
      urlReturn: `${input.appUrl}/platnosc/sukces?order=${encodeURIComponent(
        purchase.publicOrderNumber,
      )}`,
      urlStatus: `${input.appUrl}/api/payments/przelewy24/status`,
    });
  } catch (error) {
    await dependencies.repository.markPurchaseRegistrationFailed(
      purchase.purchaseId,
      error instanceof Error ? error.name : "UnknownPaymentError",
    );

    throw new CheckoutError(
      "provider_unavailable",
      "The payment could not be started.",
    );
  }

  await dependencies.repository.markPurchaseRegistered(
    purchase.purchaseId,
    registration.token,
  );

  return {
    purchaseId: purchase.purchaseId,
    publicOrderNumber: purchase.publicOrderNumber,
    redirectUrl: dependencies.gateway.getPaymentUrl(registration.token),
  };
}
