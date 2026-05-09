/**
 * Email Template Service — Server-only
 * ======================================
 * Builds the HTML email template for admin notifications.
 * This module is server-only — never imported from client code.
 *
 * @see src/server/server-email.ts where this is used
 */

import type { NotifyRequest } from "../types/survey";

// ---------------------------------------------------------------------------
// Email HTML template builder
// ---------------------------------------------------------------------------

/**
 * Builds a formatted HTML email from the survey notification data.
 * Uses inline styles for maximum email client compatibility.
 *
 * @param data - The notification request containing document and docId
 * @returns Complete HTML string for the email body
 */
export function buildEmailHtml(data: NotifyRequest): string {
  const { document: doc, docId } = data;

  const section = (title: string, rows: [string, string | string[]][]) => {
    const rowsHtml = rows
      .map(([label, value]) => {
        const displayValue = Array.isArray(value)
          ? value.join(", ") || "—"
          : value || "—";
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#111827;font-size:13px;">${displayValue}</td>
          </tr>`;
      })
      .join("");

    return `
      <div style="margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">${title}</h3>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;">
          ${rowsHtml}
        </table>
      </div>`;
  };

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f9fafb;">
        <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
          <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;">
              <h1 style="margin:0;color:white;font-size:20px;font-weight:600;">New Survey Response</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">SEO · GEO · AEO Platform Research</p>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
                Document ID: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${docId}</code>
              </p>
              ${section("Profile & Workflow", [
    ["Role", doc.profile.role],
    ["Scale", doc.profile.scale],
    ["Tech Stack", doc.profile.stack],
    ["Experience", doc.profile.experience],
    ["Email", doc.profile.email || "(not provided)"],
    ["Name Suggestion", doc.profile.nameSuggestion || "(none)"],
  ])}
              ${section("Current Problems", [
    ["Tools Used", doc.workflow.tools],
    ["Biggest Time Sink", doc.workflow.timeSink],
    ["Audit Duration", doc.workflow.auditDuration],
    ["Top Frustration", doc.workflow.frustration],
  ])}
              ${section("AI & Trust", [
    ["Hardest Area", doc.aiTrust.hardestArea],
    ["AI Usage", doc.aiTrust.aiUsage],
    ["Trust Blockers", doc.aiTrust.trustBlocker],
    ["Code Audit Value", doc.aiTrust.codeAudit],
  ])}
              ${section("Product Validation", [
    ["Unified Platform Value", doc.productValidation.unifiedValue],
    ["Priority Features", doc.productValidation.features],
    ["Willing to Pay", doc.productValidation.willingToPay],
    ["Fix One Thing", doc.productValidation.fixOneThing || "(not provided)"],
    ["Wishlist", doc.productValidation.wishlist || "(not provided)"],
    ["contributorContact", doc.productValidation.contributorContact || "(not provided)"],
  ])}
            </div>
            <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                This is an automated notification from the SEO Survey Platform.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>`;
}
