/**
 * ContactModal — Team Contact Dialog
 * =====================================
 * A modal dialog with WhatsApp and LinkedIn contact options.
 * Uses Framer Motion for smooth enter/exit animations.
 *
 * CUSTOMIZATION:
 * Update WHATSAPP_URL and LINKEDIN_URL below with your actual contact links.
 * WhatsApp format: https://wa.me/PHONE_NUMBER (include country code, no +)
 * LinkedIn format: https://www.linkedin.com/in/YOUR_PROFILE/
 *
 * ACCESSIBILITY:
 * - role="dialog" + aria-modal for screen readers
 * - Backdrop click closes the modal
 * - Close button with aria-label
 * - Focus management handled by Framer Motion presence
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Contact URLs — Sourced from environment variables
// ---------------------------------------------------------------------------

/** WhatsApp link — format: https://wa.me/PHONE_NUMBER (no + or dashes) */
const WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_URL || "https://wa.me/";

/** LinkedIn profile URL */
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop — click to close */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Contact"
            className="glass-strong relative w-full max-w-md rounded-3xl p-8 glow-soft"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-2xl font-semibold tracking-tight">Connect With Us</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Open to collaboration, partnerships, and early access conversations with serious SEO professionals.
            </p>

            {/* Contact links */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="glass flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/5"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
                WhatsApp
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="glass flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/5"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px] shadow-sky-400" />
                LinkedIn
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
