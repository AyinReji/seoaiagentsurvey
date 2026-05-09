/**
 * Firestore Survey Submission — Client-side Write Logic
 * ======================================================
 * This module handles structuring survey form data and writing it
 * to Firestore. It is the single entry point for survey submission.
 *
 * LIFECYCLE:
 * 1. Raw form data arrives from React Hook Form
 * 2. "Other" selections are resolved with user's custom text
 * 3. Data is structured into the Firestore document schema
 * 4. Document is written to the `surveyResponses` collection
 * 5. Server-side email notification is triggered (fire-and-forget)
 *
 * ERROR HANDLING:
 * - Returns `{ ok: false, error }` on ANY failure — no silent data loss
 * - Firebase misconfiguration is a hard error, not a fake success
 * - The calling component displays error messages to the user
 *
 * @see src/types/survey.ts for type definitions
 * @see src/lib/firebase.ts for Firebase initialization
 * @see src/server/server-email.ts for email notification
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDb, isFirebaseConfigured, debugFirebaseEnv } from "./firebase";
import { sendEmailNotification } from "../server/server-email";
import type { SurveyPayload, SurveyDocument } from "../types/survey";

// Re-export types for backward compatibility with existing imports
export type { SurveyPayload, SurveyDocument };

// ---------------------------------------------------------------------------
// "Other" option resolution
// ---------------------------------------------------------------------------

/**
 * Resolves "Other" selections by replacing the literal "Other" string
 * with the user's custom text from the corresponding `_other` field.
 *
 * Example transformations:
 *   Multi-select: { stack: ["WordPress", "Other"], stack_other: "Astro" }
 *              → { stack: ["WordPress", "Astro"] }
 *
 *   Single-select: { role: "Other", role_other: "Content Strategist" }
 *               → { role: "Content Strategist" }
 *
 * @param value - The raw value from the form (string or string[])
 * @param otherText - The custom text from the `_other` field
 * @returns The resolved value with "Other" replaced
 */
function resolveOther(
  value: unknown,
  otherText: string | undefined,
): unknown {
  const replacement = otherText?.trim() || "Other (unspecified)";

  // Multi-select: replace "Other" in the array with custom text
  if (Array.isArray(value)) {
    return value.map((item: string) =>
      item === "Other" ? replacement : item,
    );
  }

  // Single-select: replace "Other" string with custom text
  if (value === "Other") {
    return replacement;
  }

  return value;
}

// ---------------------------------------------------------------------------
// Payload structuring — transforms flat form data into Firestore schema
// ---------------------------------------------------------------------------

/**
 * Transforms the flat React Hook Form data into the structured Firestore
 * document schema. This is where "Other" values get resolved and metadata
 * is attached.
 *
 * @param raw - Raw form values from `methods.getValues()`
 * @returns Structured document ready for Firestore
 */
function structurePayload(raw: SurveyPayload): SurveyDocument {
  /**
   * Helper: get a field value, resolving "Other" if needed.
   * Looks for `fieldName_other` to find custom replacement text.
   */
  const get = (fieldName: string): unknown => {
    const value = raw[fieldName];
    const otherText = raw[`${fieldName}_other`] as string | undefined;
    return resolveOther(value, otherText);
  };

  /** Helper: safely cast to string */
  const str = (fieldName: string): string =>
    (get(fieldName) as string) ?? "";

  /** Helper: safely cast to string array */
  const arr = (fieldName: string): string[] =>
    (get(fieldName) as string[]) ?? [];

  return {
    submittedAt: serverTimestamp(),

    profile: {
      role: str("role"),
      scale: str("scale"),
      stack: arr("stack"),
      experience: str("experience"),
      email: str("email"),
      nameSuggestion: str("nameSuggestion"),
    },

    workflow: {
      tools: arr("tools"),
      timeSink: str("timeSink"),
      auditDuration: str("auditDuration"),
      frustration: str("frustration"),
    },

    aiTrust: {
      hardestArea: str("hardestArea"),
      aiUsage: str("aiUsage"),
      trustBlocker: arr("trustBlocker"),
      codeAudit: str("codeAudit"),
    },

    productValidation: {
      unifiedValue: str("unifiedValue"),
      features: arr("features"),
      willingToPay: str("willingToPay"),
      fixOneThing: str("fixOneThing"),
      wishlist: str("wishlist"),
      contributorContact: str("contributorContact"),

    },

    metadata: {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      submittedFrom: typeof window !== "undefined" ? window.location.href : "server",
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
    },
  };
}

// ---------------------------------------------------------------------------
// Main submission function — called by the survey form
// ---------------------------------------------------------------------------

/**
 * Submits the survey response to Firestore.
 *
 * This function does NOT silently succeed when Firebase is misconfigured.
 * If environment variables are missing, it returns a clear error so the
 * user sees a real failure message.
 *
 * @param payload - Raw form data from React Hook Form's `getValues()`
 * @returns Object with `ok` status and optional `error` message
 */
export async function submitSurvey(
  payload: SurveyPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Structure the flat form data into the Firestore document schema
    const document = structurePayload(payload);

    // ----- Strict environment validation (no fake success) -----
    if (!isFirebaseConfigured()) {
      // Log env state for debugging
      debugFirebaseEnv();
      console.error(
        "[survey] FATAL: Firebase is not configured.",
        "Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and",
        "VITE_FIREBASE_PROJECT_ID in your .env.local file.",
      );
      // Log the structured payload so data is not completely lost
      console.log("[survey] Unsaved payload:", JSON.stringify(document, null, 2));
      return {
        ok: false,
        error: "Firebase is not configured. Your response could not be saved. Please contact the site administrator.",
      };
    }

    // ----- Firestore write -----
    console.log("[survey] Attempting Firestore write to 'surveyResponses'...");

    const docRef = await addDoc(
      collection(getDb(), "surveyResponses"),
      document,
    );

    console.log("[survey] Firestore write successful:", docRef.id);

    // ----- Trigger server-side email notification (fire-and-forget) -----
    // We don't await this — email failure should not block the success UI.
    // The document is already safely persisted in Firestore.
    triggerEmailNotification(document, docRef.id).catch((err) =>
      console.error("[survey] Email notification failed (non-blocking):", err),
    );

    return { ok: true };
  } catch (error) {
    // Firestore write failures, network errors, etc.
    console.error("[survey] Firestore submission failed:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Server-side email notification trigger
// ---------------------------------------------------------------------------

/**
 * Triggers the server-side email notification via TanStack Start RPC.
 * This is fire-and-forget — failures are logged but don't block the user.
 *
 * The server function handles:
 * - Formatting the email HTML
 * - Sending via Resend API
 * - Using server-only secrets (RESEND_API_KEY)
 *
 * @param document - The structured survey document
 * @param docId - The Firestore document ID for reference
 */
async function triggerEmailNotification(
  document: SurveyDocument,
  docId: string,
): Promise<void> {
  try {
    // Strip submittedAt (FieldValue) before sending — it's not serializable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { submittedAt, ...serializableDoc } = document;
    await sendEmailNotification({ data: { document: serializableDoc, docId } });
    console.log("[survey] Email notification triggered for:", docId);
  } catch (error) {
    // Network errors or server failures — logged, not thrown
    console.error("[survey] Email notification request failed:", error);
  }
}
