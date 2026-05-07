/**
 * Vite Configuration for SEO Survey Platform
 * ============================================
 * Uses TanStack Start with the following plugins:
 *   - tanstackStart()  → SSR, server functions, file-based routing
 *   - react()          → React Fast Refresh for development
 *   - tailwindcss()    → Tailwind CSS v4 JIT compilation
 *   - tsconfigPaths()  → Resolve `@/` path aliases from tsconfig.json
 *   - cloudflare()     → Cloudflare Workers deployment (build only)
 *
 * Environment variables prefixed with VITE_ are exposed to the client bundle.
 * Server-only secrets (FIREBASE_*, RESEND_*) must NOT use the VITE_ prefix.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
 */
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    // TanStack Start — enables SSR, server functions, and file-based routing
    tanstackStart({
      server: { entry: "server" },
    }),
    // React plugin — enables JSX transform and Fast Refresh in dev
    react(),
    // Tailwind CSS v4 — JIT compilation via Vite plugin
    tailwindcss(),
    // Resolve @/ path aliases defined in tsconfig.json
    tsconfigPaths(),
    // Cloudflare Workers deployment target (only active during build)
    ...(process.env.NODE_ENV === "production" ? [cloudflare()] : []),
  ],
  // Dedupe React to prevent multiple instances in SSR bundle
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
});
