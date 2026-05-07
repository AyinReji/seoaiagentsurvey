/**
 * Landing Page — Home Route (/)
 * ================================
 * The main entry point of the survey platform. Displays:
 *   - Hero section with gradient text heading
 *   - Value proposition paragraph
 *   - Trust pills ("2–3 Minute Survey", "No Spam", etc.)
 *   - Primary CTA → navigates to /survey
 *   - Secondary CTA → opens contact modal
 *   - Reassurance copy about survey duration and privacy
 *
 * ANIMATIONS:
 * All elements use staggered Framer Motion animations with increasing
 * delays (0.1s increments) for a cascading entrance effect.
 *
 * The "Start Survey" button uses the `animate-pulse-glow` CSS class
 * for a breathing glow effect that draws attention.
 *
 * @see src/styles.css for the pulse-glow keyframes
 * @see src/components/CosmicBackground.tsx for the starfield backdrop
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ContactModal } from "@/components/ContactModal";
import { Footer } from "@/components/Footer";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Next-Gen SEO · GEO · AEO Platform — Research Survey" },
      {
        name: "description",
        content:
          "Help shape an AI-powered SEO, GEO and AEO platform built for real workflows. Take the 2–3 minute professional survey.",
      },
      { property: "og:title", content: "Next-Gen SEO · GEO · AEO Platform" },
      { property: "og:description", content: "AI-Powered SEO · GEO · AEO research survey for professionals." },
    ],
  }),
  component: Index,
});

// ---------------------------------------------------------------------------
// Trust signal pills displayed below the heading
// ---------------------------------------------------------------------------

const PILLS = ["2–3 Minute Survey", "Professionals Only", "No Spam", "Early Beta Access"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Index() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Animated cosmic starfield background */}
      <CosmicBackground />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        {/* Badge — "Next-Generation Search Optimization" with pulsing dot */}
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px] shadow-primary" />
          Next-Generation Search Optimization
        </motion.span>

        {/* Main heading — gradient text with balance wrapping */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-balance mt-6 bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-5xl md:text-6xl"
        >
          The Next Generation of Search Optimization Starts Here
        </motion.h1>

        {/* Primary value proposition */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-balance mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          AI-Powered SEO · GEO · AEO Platform which helps businesses optimize for search engines, AI assistants, and answer-driven discovery from one unified workflow.
        </motion.p>

        {/* Secondary copy — why the survey matters */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-balance mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground/80"
        >
          Your insights help us build a platform focused on real workflows, not assumptions. This survey helps us design a faster, more accurate, and beginner-friendly product around real workflow issues.
        </motion.p>

        {/* Trust signal pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {PILLS.map((p) => (
            <span key={p} className="glass rounded-full px-3.5 py-1.5 text-xs text-muted-foreground">
              {p}
            </span>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
        >
          {/* Primary CTA — navigates to /survey */}
          <Link
            to="/survey"
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-7 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto animate-pulse-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.16 255), oklch(0.7 0.2 285))",
            }}
          >
            Start Survey
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Secondary CTA — opens contact modal */}
          <button
            onClick={() => setContactOpen(true)}
            className="glass inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-medium text-foreground transition hover:border-white/20 hover:bg-white/5 sm:w-auto"
          >
            <Mail size={16} />
            Contact
          </button>
        </motion.div>

        {/* Reassurance copy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-7 max-w-lg space-y-1 text-xs leading-relaxed text-muted-foreground/70"
        >
          <p>Takes only 2–3 minutes to complete.</p>
          <p>We value genuine professional insights over mass responses.</p>
          <p>Email IDs are optional and only used for beta access, early testing, and launch updates. No spam.</p>
        </motion.div>
      </section>

      <Footer />

      {/* Contact modal */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  );
}
