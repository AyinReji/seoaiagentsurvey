/**
 * Server Entry Point — Cloudflare Workers / Edge Runtime
 * ========================================================
 * This is the main server entry for the application. It wraps the
 * TanStack Start server entry with error handling to catch and recover
 * from SSR failures that h3 (the underlying HTTP framework) swallows.
 *
 * WHY THIS EXISTS:
 * h3 catches in-handler throws and converts them to generic 500 responses
 * with body `{"unhandled":true,"message":"HTTPError"}`. This wrapper
 * detects those swallowed errors and replaces them with a branded
 * error page instead of showing raw JSON to users.
 *
 * ERROR FLOW:
 * 1. Global error listeners capture the original Error object
 * 2. h3 swallows the throw into a 500 JSON response
 * 3. This wrapper detects the JSON signature
 * 4. Retrieves the captured Error for proper logging
 * 5. Returns a user-friendly HTML error page
 *
 * DEPLOYMENT:
 * - Referenced by wrangler.jsonc as the main entry point
 * - Also used by vite.config.ts `server.entry` option
 * - Works with Cloudflare Workers, Vercel Edge, and Netlify Edge
 *
 * @see src/lib/error-capture.ts for the global error listener
 * @see src/lib/error-page.ts for the fallback HTML template
 */

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

/** Lazily imports and caches the TanStack Start server entry */
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

/** Returns a branded HTML error response instead of raw JSON */
function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Detects h3's swallowed error JSON signature.
 * Pattern: {"unhandled":true,"message":"HTTPError","status":500}
 */
function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

/**
 * Inspects 500 responses for h3's swallowed error pattern.
 * If detected, replaces with branded error page and logs the original error.
 */
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// ---------------------------------------------------------------------------
// Export — Cloudflare Workers entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
