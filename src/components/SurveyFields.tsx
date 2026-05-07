/**
 * Survey Field Components — Reusable Form Inputs
 * =================================================
 * These components are used by the survey page to render different field types.
 * They all hook into React Hook Form via `useFormContext()` — this allows them
 * to be deeply nested without prop drilling the form instance.
 *
 * COMPONENTS:
 *   FieldLabel   — Displays the question text with required/optional indicator
 *   ChoiceGroup  — Radio buttons (single) or checkboxes (multi) with "Other" handling
 *   TextField    — Single-line text/email input
 *   TextArea     — Multi-line text input
 *   ErrorText    — Animated error message display
 *
 * "OTHER" OPTION HANDLING:
 * When an option with label "Other" is selected:
 * 1. The option chip is replaced with a text input
 * 2. A hidden field `{name}_other` stores the custom text
 * 3. The text input is auto-focused for immediate typing
 * 4. When "Other" is deselected, the custom text is cleared
 * 5. On submission, firebase.ts resolves "Other" → custom text
 *
 * VALIDATION:
 * - Required single choice: must have a non-empty string value
 * - Required multi choice: array must have at least 1 item
 * - "Other" text: required when "Other" is selected, max 200 chars
 * - Email: validated against regex pattern
 * - Text fields: max length enforcement
 *
 * ACCESSIBILITY:
 * - aria-invalid on inputs with errors
 * - role="alert" on error messages
 * - sr-only class hides native radio/checkbox but keeps them focusable
 * - Auto-focus on "Other" text input for keyboard users
 *
 * @see src/routes/survey.tsx for section definitions and field configs
 * @see src/lib/firebase.ts for "Other" resolution before Firestore write
 */

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFormContext } from "react-hook-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Option shape used by ChoiceGroup */
type Option = { label: string; value?: string };

// ---------------------------------------------------------------------------
// FieldLabel — Question text with required/optional badges
// ---------------------------------------------------------------------------

export function FieldLabel({
  children,
  optional,
  required,
}: {
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h3 className="text-base font-medium leading-snug text-foreground sm:text-lg">
        {children}
        {/* Red asterisk for required fields */}
        {required && <span className="ml-1 text-[oklch(0.75_0.18_25)]">*</span>}
      </h3>
      {/* "OPTIONAL" badge for non-required fields */}
      {optional && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Optional</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The literal string used to identify "Other" options */
const OTHER_VALUE = "Other";

// ---------------------------------------------------------------------------
// ErrorText — Animated error message
// ---------------------------------------------------------------------------

/**
 * Displays validation error messages with a slide-in animation.
 * Wraps in AnimatePresence so the message smoothly exits when resolved.
 */
function ErrorText({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-2 text-xs text-[oklch(0.78_0.18_25)]"
          role="alert"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// ChoiceGroup — Radio/Checkbox group with "Other" text replacement
// ---------------------------------------------------------------------------

/**
 * Renders a grid of selectable options (radio for single, checkbox for multi).
 *
 * SPECIAL BEHAVIOR — "Other" option:
 * When a user selects the "Other" option, the option label chip is replaced
 * with a text input. The text is stored in a separate `{name}_other` field.
 *
 * Visual states:
 * - Unselected: transparent border, subtle hover
 * - Selected: colored border + background glow using the section's `tint` color
 * - "Other" active: text input with colored border and glow
 *
 * @param name     - Form field name (e.g., "role", "stack")
 * @param options  - Array of { label, value? } objects
 * @param multi    - If true, allows multiple selections (checkboxes)
 * @param tint     - oklch color string for selected state styling
 * @param required - If true, at least one option must be selected
 */
export function ChoiceGroup({
  name,
  options,
  multi,
  tint,
  required,
}: {
  name: string;
  options: Option[];
  multi?: boolean;
  tint: string;
  required?: boolean;
}) {
  const {
    register,
    watch,
    setValue,
    unregister,
    formState: { errors },
    trigger,
  } = useFormContext();

  // Watch the main field value and the "Other" text field
  const value = watch(name);
  const otherFieldName = `${name}_other`;
  const otherText = watch(otherFieldName) ?? "";

  /** Check if a specific value is currently selected */
  const selected = (v: string) =>
    multi ? Array.isArray(value) && value.includes(v) : value === v;

  const otherSelected = selected(OTHER_VALUE);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wasOtherRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Effect: manage "Other" text field lifecycle
  // When "Other" is deselected, clear and unregister the _other field.
  // When "Other" is newly selected, auto-focus the text input.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!otherSelected && wasOtherRef.current) {
      // "Other" was just deselected — clean up the _other field
      setValue(otherFieldName, "", { shouldDirty: true });
      unregister(otherFieldName, { keepValue: false });
    }
    if (otherSelected && !wasOtherRef.current) {
      // "Other" was just selected — focus the text input
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    wasOtherRef.current = otherSelected;
  }, [otherSelected, otherFieldName, setValue, unregister]);

  // ---------------------------------------------------------------------------
  // Validation rules
  // ---------------------------------------------------------------------------

  /** Main field validation — ensures at least one option is selected */
  const validate = (val: unknown) => {
    if (!required) return true;
    if (multi) return (Array.isArray(val) && val.length > 0) || "Please select at least one option";
    return (typeof val === "string" && val.length > 0) || "Please select an option";
  };

  /**
   * "Other" text field registration with validation.
   * Only required when "Other" is currently selected.
   */
  const otherRegister = register(otherFieldName, {
    validate: (val) => {
      if (!otherSelected) return true;
      return (typeof val === "string" && val.trim().length > 0) || "Please specify your answer";
    },
    maxLength: { value: 200, message: "Max 200 characters" },
  });

  // Extract error objects for display
  const fieldError = (errors as Record<string, { message?: string } | undefined>)[name];
  const otherError = (errors as Record<string, { message?: string } | undefined>)[otherFieldName];

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const v = opt.value ?? opt.label;
          const isOther = v === OTHER_VALUE;
          const isSel = selected(v);

          // ---------------------------------------------------------------------------
          // "Other" option — selected state: render text input instead of label
          // ---------------------------------------------------------------------------
          if (isOther && otherSelected) {
            return (
              <AnimatePresence key={v} mode="wait" initial={false}>
                <motion.div
                  key="other-input"
                  initial={{ opacity: 0, y: 4, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition"
                  style={{
                    borderColor: tint,
                    background: `color-mix(in oklab, ${tint} 12%, transparent)`,
                    boxShadow: `0 0 24px -8px ${tint}`,
                  }}
                >
                  {/* Deselect button — clicking removes "Other" from selection */}
                  <button
                    type="button"
                    aria-label="Clear custom answer"
                    onClick={() => {
                      if (multi) {
                        const arr = Array.isArray(value) ? value : [];
                        setValue(
                          name,
                          arr.filter((x: string) => x !== OTHER_VALUE),
                          { shouldDirty: true, shouldTouch: true, shouldValidate: true },
                        );
                      } else {
                        setValue(name, "", { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                      }
                    }}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: tint, background: tint }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-background" />
                  </button>

                  {/* Custom text input for "Other" */}
                  <input
                    {...otherRegister}
                    ref={(el) => {
                      otherRegister.ref(el);
                      inputRef.current = el;
                    }}
                    onBlur={(e) => {
                      otherRegister.onBlur(e);
                      void trigger(otherFieldName);
                    }}
                    type="text"
                    placeholder="Type your answer…"
                    aria-label="Other — please specify"
                    aria-invalid={!!otherError}
                    maxLength={200}
                    defaultValue={otherText}
                    className="w-full bg-transparent leading-snug text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                </motion.div>
              </AnimatePresence>
            );
          }

          // ---------------------------------------------------------------------------
          // Standard option — radio button or checkbox
          // ---------------------------------------------------------------------------
          return (
            <label
              key={v}
              className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm transition hover:border-white/15 hover:bg-white/[0.04]"
              style={
                isSel
                  ? {
                      borderColor: tint,
                      background: `color-mix(in oklab, ${tint} 12%, transparent)`,
                      boxShadow: `0 0 24px -8px ${tint}`,
                    }
                  : undefined
              }
            >
              {/* Native input (visually hidden but accessible) */}
              <input
                type={multi ? "checkbox" : "radio"}
                value={v}
                {...register(name, { validate })}
                className="peer sr-only"
              />
              {/* Custom radio/checkbox indicator */}
              <span
                aria-hidden
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20"
                style={isSel ? { borderColor: tint, background: tint } : undefined}
              >
                {isSel && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
              </span>
              <span className="leading-snug">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {/* Display validation errors */}
      <ErrorText message={fieldError?.message || otherError?.message} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextField — Single-line text or email input
// ---------------------------------------------------------------------------

/**
 * Renders a styled text input with validation.
 *
 * Features:
 * - Required field validation (when required=true)
 * - Email format validation (when type="email")
 * - Max length enforcement
 * - Error state with colored border
 * - Optional description text below the input
 *
 * @param name        - Form field name
 * @param placeholder - Input placeholder text
 * @param type        - Input type ("text" or "email")
 * @param description - Helper text displayed below the input
 * @param required    - Whether the field is required
 * @param maxLength   - Maximum character count (default: 200)
 */
export function TextField({
  name,
  placeholder,
  type = "text",
  description,
  required,
  maxLength = 200,
}: {
  name: string;
  placeholder?: string;
  type?: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const id = useId();
  const error = (errors as Record<string, { message?: string } | undefined>)[name];

  // Build validation rules object
  const rules: Parameters<typeof register>[1] = {
    maxLength: { value: maxLength, message: `Max ${maxLength} characters` },
  };

  // Required field validation
  if (required) {
    rules.validate = (v: unknown) =>
      (typeof v === "string" && v.trim().length > 0) || "This field is required";
  }

  // Email format validation — overrides required validate
  if (type === "email") {
    const prev = rules.validate;
    rules.validate = (v: unknown) => {
      const s = typeof v === "string" ? v.trim() : "";
      // Empty email: only invalid if required
      if (!s) return required ? "Email is required" : true;
      // Validate format: basic pattern matching user@domain.tld
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
      return ok || "Please enter a valid email";
    };
    void prev; // Previous validator is replaced, not chained
  }

  return (
    <div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!error}
        {...register(name, rules)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-white/25 focus:bg-white/[0.05]"
        style={error ? { borderColor: "oklch(0.7 0.18 25)" } : undefined}
      />
      {/* Optional helper/description text */}
      {description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">{description}</p>}
      <ErrorText message={error?.message} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextArea — Multi-line text input
// ---------------------------------------------------------------------------

/**
 * Renders a styled textarea with validation.
 *
 * @param name        - Form field name
 * @param placeholder - Textarea placeholder text
 * @param required    - Whether the field is required
 * @param maxLength   - Maximum character count (default: 1000)
 */
export function TextArea({
  name,
  placeholder,
  required,
  maxLength = 1000,
}: {
  name: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = (errors as Record<string, { message?: string } | undefined>)[name];

  const rules: Parameters<typeof register>[1] = {
    maxLength: { value: maxLength, message: `Max ${maxLength} characters` },
  };
  if (required) {
    rules.validate = (v: unknown) =>
      (typeof v === "string" && v.trim().length > 0) || "This field is required";
  }

  return (
    <div>
      <textarea
        rows={4}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!error}
        {...register(name, rules)}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-white/25 focus:bg-white/[0.05]"
        style={error ? { borderColor: "oklch(0.7 0.18 25)" } : undefined}
      />
      <ErrorText message={error?.message} />
    </div>
  );
}
