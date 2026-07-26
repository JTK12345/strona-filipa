type LogStatus = "info" | "error";

type LogContext = {
  eventType: string;
  stage: string;
  status: LogStatus;
  requestId?: string;
  ipHash?: string;
  error?: unknown;
};

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

function getErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" || typeof code === "number") {
      return String(code);
    }
  }

  return undefined;
}

export function logServerEvent({ eventType, stage, status, requestId, ipHash }: LogContext) {
  console[status](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      stage,
      status,
      requestId,
      ipHash,
    })
  );
}

export function logServerError({
  eventType,
  stage,
  requestId,
  ipHash,
  error,
}: Omit<LogContext, "status">) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      stage,
      status: "error",
      requestId,
      ipHash,
      errorName: getErrorName(error),
      errorCode: getErrorCode(error),
    })
  );
}
