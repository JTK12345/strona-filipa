export type CheckoutRequestBody = {
  courseId: string;
  termsAccepted: true;
  digitalContentAccepted: true;
};

const maximumBodySize = 4096;

export async function readCheckoutRequest(
  request: Request,
): Promise<CheckoutRequestBody | null> {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? "0");

  if (
    !contentType.includes("application/json") ||
    (Number.isFinite(declaredLength) && declaredLength > maximumBodySize)
  ) {
    return null;
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).length > maximumBodySize) {
      return null;
    }

    body = JSON.parse(rawBody);
  } catch {
    return null;
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 3 ||
    !("courseId" in body) ||
    typeof body.courseId !== "string" ||
    !("termsAccepted" in body) ||
    body.termsAccepted !== true ||
    !("digitalContentAccepted" in body) ||
    body.digitalContentAccepted !== true
  ) {
    return null;
  }

  return body as CheckoutRequestBody;
}
