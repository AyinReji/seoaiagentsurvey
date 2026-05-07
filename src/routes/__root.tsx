/**
 * Root Route — Application Shell & Global Configuration
 * ========================================================
 * This is the root layout that wraps every page in the application.
 * It provides:
 *   - HTML document structure (<html>, <head>, <body>)
 *   - Global meta tags (SEO, Open Graph, Twitter)
 *   - Font loading (Inter from Google Fonts)
 *   - Favicon configuration
 *   - Global CSS import
 *   - React Query provider
 *   - 404 and error boundary components
 *
 * FAVICON SYSTEM:
 * Replace the placeholder favicon references below with your production
 * brand assets. Place the icon files in the `public/` directory:
 *   - /favicon.ico          → 32x32 ICO format (browser tab icon)
 *   - /favicon-16x16.png    → 16x16 PNG
 *   - /favicon-32x32.png    → 32x32 PNG
 *   - /apple-touch-icon.png → 180x180 PNG (iOS home screen)
 *   - /site.webmanifest     → PWA manifest with icon references
 *
 * Generate favicons from your logo using: https://realfavicongenerator.net
 *
 * @see https://tanstack.com/router/latest/docs/framework/react/guide/document-head
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

// ---------------------------------------------------------------------------
// 404 Not Found Component
// ---------------------------------------------------------------------------

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error Boundary Component
// ---------------------------------------------------------------------------

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Route Configuration
// ---------------------------------------------------------------------------

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Next-Gen SEO · GEO · AEO Platform" },
      { name: "description", content: "AI-Powered SEO · GEO · AEO research survey for professionals." },
      { name: "author", content: "Research Team" },
      // Open Graph meta tags for social sharing
      { property: "og:title", content: "Next-Gen SEO · GEO · AEO Platform" },
      { property: "og:description", content: "AI-Powered SEO · GEO · AEO research survey." },
      { property: "og:type", content: "website" },
      // Twitter card configuration
      // TODO: Replace with your Twitter/X handle when available
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      // Google Fonts — Inter (400, 500, 600, 700 weights)
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
      // Application styles
      { rel: "stylesheet", href: appCss },

      // ---------------------------------------------------------------
      // FAVICON SYSTEM — Replace these placeholder icons with your
      // production brand assets. Place files in the `public/` directory.
      //
      // Generate favicons from your logo:
      //   https://realfavicongenerator.net
      //   https://favicon.io
      //
      // Required files in public/:
      //   favicon.ico           → Standard browser favicon (32x32)
      //   favicon-16x16.png     → Small favicon variant
      //   favicon-32x32.png     → Standard favicon variant
      //   apple-touch-icon.png  → iOS home screen icon (180x180)
      //   site.webmanifest      → PWA manifest with icon references
      // ---------------------------------------------------------------
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// ---------------------------------------------------------------------------
// Shell — HTML document wrapper (rendered during SSR)
// ---------------------------------------------------------------------------

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// ---------------------------------------------------------------------------
// Root Component — wraps all pages with providers
// ---------------------------------------------------------------------------

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
