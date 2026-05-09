/**
 * Survey Page — Multi-Step Professional Research Survey
 * ======================================================
 * This is the main survey route (/survey) that collects professional insights
 * from SEO practitioners. The survey is divided into 4 sections:
 *
 * 1. Profile & Workflow     — Who they are, what CMS/frameworks they use
 * 2. Current Problems       — Pain points with existing tools
 * 3. AI, GEO & Trust        — Perspectives on AI in SEO workflows
 * 4. Product Validation     — Feature priorities and willingness to pay
 *
 * FORM ARCHITECTURE:
 * - Uses React Hook Form with `shouldUnregister: false` to persist values
 *   across step navigation (going back doesn't lose data)
 * - FormProvider wraps the entire form for deep component access
 * - Validation is triggered per-section via `methods.trigger()` — only
 *   the current step's fields are validated before advancing
 *
 * NAVIGATION:
 * - `step` state controls which section is visible
 * - AnimatePresence provides smooth crossfade transitions between steps
 * - Back button decrements step, Continue/Submit increments or submits
 *
 * SUBMISSION LIFECYCLE:
 * 1. User clicks "Submit Survey" on the last step
 * 2. `next()` validates the current section's fields
 * 3. If valid, `submitSurvey()` is called with raw form data
 * 4. Firebase client writes to Firestore `surveyResponses` collection
 * 5. "Other" selections are resolved to custom text before storage
 * 6. Fire-and-forget POST to /api/notify triggers admin email
 * 7. Success: show thank-you screen / Error: show error toast
 *
 * @see src/lib/firebase.ts for submission logic and payload structuring
 * @see src/components/SurveyFields.tsx for field components
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Mail, Sparkles, AlertCircle } from "lucide-react";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ContactModal } from "@/components/ContactModal";
import { Footer } from "@/components/Footer";
import { ChoiceGroup, FieldLabel, TextArea, TextField } from "@/components/SurveyFields";
import { submitSurvey } from "@/lib/firestore";

// ---------------------------------------------------------------------------
// Route definition — TanStack Router file-based routing
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/survey")({
  ssr: false,

  head: () => ({
    meta: [
      { title: "Professional Survey — SEO · GEO · AEO Platform" },
      {
        name: "description",
        content:
          "Share your workflow insights to help shape an AI-powered SEO, GEO and AEO platform built for professionals.",
      },
      { property: "og:title", content: "Professional Survey — SEO · GEO · AEO Platform" },
      { property: "og:description", content: "2–3 minute research survey for SEO professionals." },
    ],
  }),
  component: SurveyPage,
});

// ---------------------------------------------------------------------------
// Helper — creates option arrays for ChoiceGroup component
// ---------------------------------------------------------------------------

/** Converts string labels into option objects: { label: "SEO Agency" } */
const opt = (...labels: string[]) => labels.map((l) => ({ label: l }));

// ---------------------------------------------------------------------------
// Survey sections configuration
// ---------------------------------------------------------------------------
// Each section defines:
//   title    — displayed as the section heading
//   subtitle — secondary description text
//   tint     — oklch color used for the progress bar and glow effects
//   accent   — gradient classes for the Continue/Submit button
//   fields   — array of field configs rendered by the form
//
// Field kinds:
//   "choice"   → radio/checkbox group (single or multi-select)
//   "text"     → single-line text input
//   "email"    → email input with format validation
//   "textarea" → multi-line text area
//
// If a choice group includes "Other", the ChoiceGroup component
// automatically shows a text input for custom answers.

const SECTIONS = [
  {
    title: "Profile & Workflow",
    subtitle: "Tell us who you are and how you work.",
    tint: "oklch(0.7 0.18 255)",
    accent: "from-[oklch(0.78_0.16_255)] to-[oklch(0.62_0.18_265)]",
    fields: [
      { kind: "choice", name: "role", q: "What best describes you?", options: opt("SEO Agency", "Freelancer", "In-house Team", "SaaS Founder", "Developer", "Other") },
      { kind: "text", name: "location", q: "Where are you based", optional: true, placeholder: "City, Country" },
      { kind: "text", name: "agencyName", q: "Agency or Company name", optional: true, placeholder: "Your agency or Company name" },
      { kind: "choice", name: "scale", q: "How many websites or clients do you actively manage?", options: opt("1–5", "6–20", "21–50", "50+") },
      { kind: "choice", name: "stack", q: "Main CMS / frameworks you work with", multi: true, options: opt("WordPress", "Shopify", "Next.js", "Webflow", "Custom Stack", "Other") },
      { kind: "choice", name: "experience", q: "Experience level in SEO / GEO / AEO", options: opt("Beginner", "Intermediate", "Advanced", "Expert") },
      { kind: "email", name: "email", q: "Email ID", optional: true, placeholder: "you@company.com", description: "We'll only use this to notify you when the platform launches, invite early testers, and give contributor benefits to professionals who helped shape the product. No spam." },
      { kind: "text", name: "nameSuggestion", q: "Any name suggestions for this platform?", optional: true, placeholder: "e.g. OrbitSEO, Helios, Atlas…" },
    ],
  },
  {
    title: "Current Problems & Workflow",
    subtitle: "Where today's tools and workflows break down.",
    tint: "oklch(0.68 0.2 295)",
    accent: "from-[oklch(0.72_0.2_290)] to-[oklch(0.58_0.22_300)]",
    fields: [
      { kind: "choice", name: "tools", q: "Which tools do you currently rely on most?", multi: true, options: opt("Ahrefs", "Semrush", "Screaming Frog", "ChatGPT / Gemini / Claude", "Custom Internal Tools", "Other") },
      { kind: "choice", name: "timeSink", q: "What consumes the MOST time in your audit workflow?", options: opt("Technical analysis", "Reporting", "Finding fixes", "Implementing fixes", "GEO / AEO optimization", "Client communication") },
      { kind: "choice", name: "auditDuration", q: "How long does a complete audit process usually take?", options: opt("Under 30 min", "30–60 min", "1–3 hours", "3+ hours") },
      { kind: "choice", name: "frustration", q: "What is your biggest frustration with existing SEO tools?", options: opt("Reports too complex", "Weak GEO/AEO support", "Slow workflow", "Poor developer guidance", "Expensive pricing", "Too much manual work", "Other") },
    ],
  },
  {
    title: "AI, GEO & Trust",
    subtitle: "How you think about AI in your workflow.",
    tint: "oklch(0.78 0.14 210)",
    accent: "from-[oklch(0.82_0.14_210)] to-[oklch(0.65_0.16_230)]",
    fields: [
      { kind: "choice", name: "hardestArea", q: "Which area feels hardest today?", options: opt("Traditional SEO", "GEO", "AEO", "Combining all three effectively") },
      { kind: "choice", name: "aiUsage", q: "Do you currently use AI tools in SEO workflows?", options: opt("Yes, heavily", "Sometimes", "Rarely", "Never") },
      { kind: "choice", name: "trustBlocker", q: "What would stop you from trusting an AI-powered audit platform?", multi: true, options: opt("Inaccurate recommendations", "Hallucinated fixes", "Lack of transparency", "Poor technical depth", "Security / privacy concerns", "Other") },
      { kind: "choice", name: "codeAudit", q: "Would code-level analysis (GitHub / ZIP audits) be valuable to you?", options: opt("Extremely valuable", "Useful sometimes", "Not important") },
    ],
  },
  {
    title: "Product Validation",
    subtitle: "Help us validate the direction.",
    tint: "oklch(0.76 0.17 55)",
    accent: "from-[oklch(0.82_0.16_60)] to-[oklch(0.65_0.18_40)]",
    fields: [
      { kind: "choice", name: "unifiedValue", q: "Would a unified SEO + GEO + AEO platform improve your workflow?", options: opt("Definitely", "Possibly", "Not sure", "No") },
      { kind: "choice", name: "features", q: "Which features would matter MOST to you?", multi: true, options: opt("AI-generated fixes", "Prioritized issues", "GEO optimization", "AEO / snippet suggestions", "White-label reports", "GitHub / ZIP code audits", "Real-time monitoring", "Competitor analysis") },
      { kind: "choice", name: "willingToPay", q: "Would you pay for an AI audit + developer-ready fixes delivered in under 2 minutes?", options: opt("Yes", "Maybe", "No") },
      { kind: "textarea", name: "fixOneThing", q: "If you could fix ONE thing about existing SEO tools, what would it be?", placeholder: "Share your honest take…" },
      { kind: "textarea", name: "wishlist", q: "Any suggestions, opinions, or features you'd genuinely like to see?", optional: true, placeholder: "Anything we missed…" },
      { kind: "textarea", name: "contributorContact", q: "Would you like to contribute insights, collaborate, or connect with us?", optional: true, placeholder: "Leave your email, LinkedIn, WhatsApp, X/Twitter, or any preferred contact details. We'd love to connect with professionals interested in contributing ideas, feedback, or industry expertise.", },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Main Survey Page Component
// ---------------------------------------------------------------------------

function SurveyPage() {
  // Step navigation state — tracks which section is currently displayed
  const [step, setStep] = useState(0);

  // Submission state machine: idle → submitting → submitted | error
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Contact modal visibility
  const [contactOpen, setContactOpen] = useState(false);

  // React Hook Form instance
  // shouldUnregister: false — preserves values when stepping back
  // mode: "onBlur" — validates fields when they lose focus
  const methods = useForm({ shouldUnregister: false, defaultValues: {}, mode: "onBlur" });

  const total = SECTIONS.length;
  const section = SECTIONS[step];
  const progress = Math.round(((step + 1) / total) * 100);
  const isLast = step === total - 1;

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------

  /**
   * Advances to the next step, or submits the survey if on the last step.
   *
   * Validation flow:
   * 1. Collect field names for the current section
   * 2. Include `_other` fields if "Other" is currently selected
   * 3. Trigger validation via React Hook Form
   * 4. If valid: advance step or submit
   */
  const next = async () => {
    // Build list of field names to validate for the current section
    const fieldNames = section.fields.flatMap((f) => {
      const isOptional = "optional" in f && f.optional;
      const base = isOptional ? [] : [f.name as string];

      // Also validate the _other text input when "Other" is selected
      const val = (methods.getValues as (n: string) => unknown)(f.name as string);
      const hasOther = Array.isArray(val) ? val.includes("Other") : val === "Other";
      return hasOther ? [...base, `${f.name}_other`] : base;
    });

    // Trigger validation for only the current section's fields
    const valid = await methods.trigger(fieldNames as never);
    if (!valid) return;

    // On the last step, submit the survey
    if (isLast) {
      setSubmitting(true);
      setSubmitError(null);

      try {
        const data = methods.getValues();

        const result = await submitSurvey(data);

        if (result.ok) {
          setSubmitted(true);
        } else {
          // Show error message to the user
          setSubmitError(result.error || "Submission failed. Please try again.");
        }
      } catch (error) {
        // Unexpected errors (network failures, etc.)
        console.error("[survey] Unexpected submission error:", error);
        setSubmitError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Advance to next step and scroll to top
    setStep((s) => s + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Navigate back one step */
  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    setSubmitError(null); // Clear any previous errors
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Animated cosmic background with stars and shooting stars */}
      <CosmicBackground />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pt-10 sm:px-6 sm:pt-16">
        {/* Top navigation bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition">
            ← Back to home
          </Link>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Research Survey
          </span>
        </div>

        {/* --------------- Sticky Progress Bar --------------- */}
        <div className="sticky top-2 z-20 mb-6">
          <div className="glass-strong rounded-2xl px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Part {step + 1} of {total} · {section.title}
              </span>
              <motion.span key={progress} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                {progress}%
              </motion.span>
            </div>
            {/* Animated progress fill with section-specific color */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${section.tint}, oklch(0.85 0.12 255))` }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 18 }}
              />
            </div>
          </div>
        </div>

        {/* --------------- Form --------------- */}
        <FormProvider {...methods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-10"
          >
            {/* Decorative gradient glow at the top of the form card */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-50 blur-3xl"
              style={{ background: `radial-gradient(ellipse at top, ${section.tint}, transparent 70%)` }}
            />

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative"
                >
                  {/* Section header */}
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>

                  {/* --------------- Dynamic field rendering --------------- */}
                  <div className="mt-8 space-y-8">
                    {section.fields.map((f) => {
                      const isOptional = "optional" in f && f.optional;
                      const required = !isOptional;
                      return (
                        <div key={f.name}>
                          {/* Field label with required/optional indicator */}
                          <FieldLabel optional={isOptional} required={required}>{f.q}</FieldLabel>

                          {/* Choice group — renders radio buttons or checkboxes */}
                          {f.kind === "choice" && (
                            <ChoiceGroup name={f.name} options={[...f.options]} multi={"multi" in f && f.multi} tint={section.tint} required={required} />
                          )}

                          {/* Single-line text input */}
                          {f.kind === "text" && (
                            <TextField name={f.name} placeholder={"placeholder" in f ? f.placeholder : undefined} required={required} />
                          )}

                          {/* Email input with format validation */}
                          {f.kind === "email" && (
                            <TextField
                              name={f.name}
                              type="email"
                              placeholder={"placeholder" in f ? f.placeholder : undefined}
                              description={"description" in f ? f.description : undefined}
                              required={required}
                            />
                          )}

                          {/* Multi-line textarea */}
                          {f.kind === "textarea" && (
                            <TextArea name={f.name} placeholder={"placeholder" in f ? f.placeholder : undefined} required={required} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* --------------- Error message display --------------- */}
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-start gap-3 rounded-2xl border border-[oklch(0.7_0.18_25_/_0.3)] bg-[oklch(0.7_0.18_25_/_0.08)] px-4 py-3"
                      role="alert"
                    >
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-[oklch(0.78_0.18_25)]" />
                      <div>
                        <p className="text-sm font-medium text-[oklch(0.85_0.12_25)]">Submission failed</p>
                        <p className="mt-0.5 text-xs text-[oklch(0.75_0.1_25)]">{submitError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* --------------- Navigation buttons --------------- */}
                  <div className="mt-10 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={back}
                      disabled={step === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-medium text-foreground transition hover:border-white/25 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${section.accent} px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 disabled:opacity-60`}
                      style={{ boxShadow: `0 0 40px -12px ${section.tint}` }}
                    >
                      {submitting ? "Submitting…" : isLast ? "Submit Survey" : "Continue"}
                      {!submitting && <ArrowRight size={16} />}
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* --------------- Success / Thank You Screen --------------- */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative py-12 text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 glow-soft">
                    <Check className="text-primary" />
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">Thank you.</h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Your insights are now part of our research. We'll reach out when early access opens to contributors first.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      to="/"
                      className="glass inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium hover:border-white/20 hover:bg-white/5"
                    >
                      Back to home
                    </Link>
                    <button
                      onClick={() => setContactOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[oklch(0.78_0.16_255)] to-[oklch(0.7_0.2_285)] px-5 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      <Sparkles size={16} /> Talk to us
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </FormProvider>

        {/* Contact button below the form */}
        {!submitted && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setContactOpen(true)}
              className="glass inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm text-muted-foreground transition hover:border-white/20 hover:text-foreground"
            >
              <Mail size={14} /> Contact the team
            </button>
          </div>
        )}
      </div>

      <Footer onContactClick={() => setContactOpen(true)} />

      {/* Contact modal overlay */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  );
}
