/**
 * Survey Types — Shared type definitions
 * ========================================
 * Central type definitions used by both client-side Firestore logic
 * and server-side email notification logic.
 *
 * IMPORTANT: This file must NOT import any Firebase, Firestore, or
 * server-only modules. It contains only pure TypeScript interfaces.
 *
 * @see src/lib/firestore.ts    — client-side Firestore writes
 * @see src/server/server-email.ts — server-side email notifications
 */

// ---------------------------------------------------------------------------
// Raw form payload from React Hook Form
// ---------------------------------------------------------------------------

/**
 * SurveyPayload represents the raw form data from React Hook Form.
 * Fields with "_other" suffix contain custom text when user selects "Other".
 */
export type SurveyPayload = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Structured Firestore document
// ---------------------------------------------------------------------------

/**
 * Structured Firestore document matching the required database schema.
 * This is what gets written to the `surveyResponses` collection.
 */
export interface SurveyDocument {
  /** Server-generated timestamp of when the survey was submitted */
  submittedAt: unknown; // FieldValue from Firestore (serverTimestamp)

  /** Section 1: User profile and work context */
  profile: {
    role: string;
    scale: string;
    stack: string[];
    experience: string;
    email: string;
    nameSuggestion: string;
  };

  /** Section 2: Current tools and pain points */
  workflow: {
    tools: string[];
    timeSink: string;
    auditDuration: string;
    frustration: string;
  };

  /** Section 3: AI trust and GEO/AEO perspectives */
  aiTrust: {
    hardestArea: string;
    aiUsage: string;
    trustBlocker: string[];
    codeAudit: string;
  };

  /** Section 4: Product validation and wishlist */
  productValidation: {
    unifiedValue: string;
    features: string[];
    willingToPay: string;
    fixOneThing: string;
    wishlist: string;
    contributorContact: string;
  };

  /** Metadata about the submission */
  metadata: {
    userAgent: string;
    submittedFrom: string;
    locale: string;
  };
}

// ---------------------------------------------------------------------------
// Email notification request (sent from client → server function)
// ---------------------------------------------------------------------------

/**
 * The payload shape sent to the server-side email notification function.
 * Contains a copy of the structured document and the Firestore document ID.
 */
export interface NotifyRequest {
  document: Omit<SurveyDocument, "submittedAt">;
  docId: string;
}
