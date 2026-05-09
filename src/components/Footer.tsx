/**
 * Footer — Global Site Footer
 * ==============================
 * Displays at the bottom of every page with:
 * - Brand tagline
 * - Navigation links (Privacy, Terms, Contact, LinkedIn)
 * - Copyright notice
 *
 * CUSTOMIZATION:
 * - Update the Privacy and Terms links to point to actual policy pages
 *   when they exist (currently both point to "/")
 * - Update the LinkedIn URL with your actual profile
 * - Add additional social links as needed
 */

import { Link } from "@tanstack/react-router";

type FooterProps = {
  onContactClick?: () => void;
};

export function Footer({ onContactClick }: FooterProps) {
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/";

  return (
    <footer className="relative z-10 mx-auto mt-24 w-full max-w-6xl px-6 pb-10 text-xs text-muted-foreground">
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md leading-relaxed">
            Building the next generation of SEO · GEO · AEO tooling for serious operators. Calm, intelligent, trustworthy.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {/* TODO: Create dedicated /privacy and /terms routes */}

            <button
              onClick={onContactClick}
              className="hover:text-foreground transition"
            >
              Contact
            </button>
            {/* LinkedIn URL is configured via VITE_LINKEDIN_URL in .env */}
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-foreground transition">LinkedIn</a>
          </div>
        </div>
        <div className="mt-6 border-t border-white/5 pt-4 text-[11px] tracking-wide">
          © {new Date().getFullYear()} — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
