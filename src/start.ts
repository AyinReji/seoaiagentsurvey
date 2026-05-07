/**
 * TanStack Start Instance — Middleware Configuration
 * =====================================================
 * Creates the TanStack Start instance with global error-handling middleware.
 *
 * The error middleware wraps every server function and route handler:
 * - Re-throws expected HTTP errors (status codes from TanStack Router)
 * - Catches unexpected errors and returns a branded HTML error page
 * - Logs the original error for debugging
 *
 * This is different from the server.ts wrapper:
 * - server.ts handles fetch-level (Cloudflare Worker) errors
 * - This middleware handles TanStack Start route/function errors
 *
 * @see src/server.ts for the outer fetch-level error handler
 * @see src/lib/error-page.ts for the HTML error template
 */

import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

/**
 * Global error middleware — catches unhandled errors in server functions
 * and route handlers, preventing raw error objects from reaching users.
 */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // Re-throw TanStack Router HTTP errors (e.g., 404, redirect)
    // These have a `statusCode` property and are expected behavior
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Unexpected error — log and return branded error page
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/** TanStack Start instance with error middleware */
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
