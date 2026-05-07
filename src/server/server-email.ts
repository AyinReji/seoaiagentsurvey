/**
 * Email Notification Server Function
 * ====================================
 * TanStack Start server function that sends admin email notifications
 * when a new survey response is submitted. Runs exclusively on the server.
 *
 * ARCHITECTURE:
 * - This file is imported by client code (src/lib/firestore.ts)
 * - TanStack Start automatically replaces the handler with an RPC stub
 *   on the client side — the actual handler only runs on the server
 * - Server-only secrets (RESEND_API_KEY) never reach the browser bundle
 *
 * ENVIRONMENT VARIABLES (server-only, NO VITE_ prefix):
 *   RESEND_API_KEY → API key from https://resend.com/api-keys
 *   EMAIL_FROM     → Verified sender email (or onboarding@resend.dev for testing)
 *   EMAIL_TO       → Admin email that receives notifications
 *
 * @see src/lib/firestore.ts where this function is called
 * @see src/server/email-service.ts for the email HTML template
 */

import { createServerFn } from "@tanstack/react-start";
import { buildEmailHtml } from "./email-service";
import type { NotifyRequest } from "../types/survey";

// ---------------------------------------------------------------------------
// Server Function Export
// ---------------------------------------------------------------------------

/**
 * Server function that sends an email notification via Resend API.
 *
 * Uses `.inputValidator()` (not `.validator()`) to match the API
 * surface of @tanstack/react-start v1.167.x.
 *
 * If RESEND_API_KEY or EMAIL_TO are not set, the email is skipped
 * gracefully with a warning logged to the server console.
 */
export const sendEmailNotification = createServerFn({ method: "POST" })
  .inputValidator((data: NotifyRequest) => data)
  .handler(async ({ data }) => {
    try {
      console.log("[notify] Processing email notification for doc:", data.docId);

      const emailHtml = buildEmailHtml(data);
      const subject = "New SEO/GEO/AEO Survey Response";

      // Server-only environment variables (no VITE_ prefix)
      const apiKey = process.env.RESEND_API_KEY ?? "";
      const emailFrom = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
      const emailTo = process.env.EMAIL_TO ?? "";

      if (!apiKey || !emailTo) {
        console.warn(
          "[notify] Resend not configured. Set RESEND_API_KEY and EMAIL_TO in .env.local.",
          "Email notification skipped for document:", data.docId,
        );
        return { success: true, message: "Email skipped (not configured)" };
      }

      // Send via Resend API
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [emailTo],
          subject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errorBody = await resendResponse.text();
        console.error(
          "[notify] Resend API error:",
          resendResponse.status,
          errorBody,
        );
        throw new Error(`Email delivery failed: ${resendResponse.status}`);
      }

      const result = await resendResponse.json();
      console.log("[notify] Email sent successfully:", result);
      return { success: true, message: "Email sent successfully" };

    } catch (error) {
      console.error("[notify] Unexpected error:", error);
      throw error;
    }
  });
