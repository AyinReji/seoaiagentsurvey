/**
 * Global Error Capture — Out-of-Band Error Preservation
 * =======================================================
 * PROBLEM:
 * h3 (the HTTP framework used by TanStack Start) catches errors thrown
 * inside request handlers and converts them into generic 500 JSON responses.
 * By the time server.ts sees the response, the original Error object
 * (with its stack trace) has been lost.
 *
 * SOLUTION:
 * This module installs global `error` and `unhandledrejection` listeners
 * that capture the original Error object before h3 swallows it.
 * server.ts then retrieves the captured error via `consumeLastCapturedError()`
 * for proper logging.
 *
 * The captured error has a 5-second TTL to prevent stale errors from
 * being associated with the wrong request.
 *
 * @see src/server.ts for where the captured error is consumed
 */

let lastCapturedError: { error: unknown; at: number } | undefined;

/** Time-to-live for captured errors — prevents stale associations */
const TTL_MS = 5_000;

/** Records an error with its timestamp */
function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// Install global error listeners (only in environments that support them)
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

/**
 * Retrieves and clears the last captured error.
 * Returns undefined if no error was captured or if it has expired (>5s old).
 */
export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
