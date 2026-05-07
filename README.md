# SEO · GEO · AEO Professional Survey Platform

A production-ready, multi-step research survey built with **TanStack Start**, **React Hook Form**, **Framer Motion**, and **Tailwind CSS v4**. Collects professional insights from SEO practitioners to shape an AI-powered platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR + Vite) |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| Forms | [React Hook Form](https://react-hook-form.com/) |
| Validation | Inline RHF validators + Zod (available) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + custom oklch theme |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Email | [Resend](https://resend.com/) |
| Deployment | Vercel / Netlify / Cloudflare Workers |

---

## Folder Structure

```
├── public/                     # Static assets (favicons, manifest)
│   ├── favicon.svg             # Placeholder favicon (replace with yours)
│   └── site.webmanifest        # PWA manifest
├── src/
│   ├── components/
│   │   ├── ContactModal.tsx    # Team contact dialog (WhatsApp/LinkedIn)
│   │   ├── CosmicBackground.tsx # Animated starfield background
│   │   ├── Footer.tsx          # Global site footer
│   │   ├── SurveyFields.tsx    # Form field components (Choice, Text, TextArea)
│   │   └── ui/                 # shadcn/ui primitives (mostly unused)
│   ├── hooks/
│   │   └── use-mobile.tsx      # Responsive breakpoint hook
│   ├── lib/
│   │   ├── error-capture.ts    # Global error capture for SSR recovery
│   │   ├── error-page.ts       # Fallback HTML error page
│   │   ├── firebase.ts         # Firebase client SDK + submission logic
│   │   └── utils.ts            # Tailwind class merger utility
│   ├── routes/
│   │   ├── __root.tsx          # Root layout (HTML shell, providers, meta)
│   │   ├── index.tsx           # Landing page (/)
│   │   ├── survey.tsx          # Multi-step survey form (/survey)
│   │   └── api/
│   │       └── notify.ts       # POST /api/notify — email notification endpoint
│   ├── router.tsx              # TanStack Router configuration
│   ├── routeTree.gen.ts        # Auto-generated route tree (do not edit)
│   ├── server.ts               # Cloudflare Workers server entry
│   ├── start.ts                # TanStack Start middleware
│   └── styles.css              # Global styles, theme, animations
├── .env.example                # Environment variable template
├── firestore.rules             # Firestore security rules
├── vite.config.ts              # Vite + TanStack Start configuration
├── wrangler.jsonc              # Cloudflare Workers configuration
└── package.json                # Dependencies and scripts
```

---

## Local Development

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm**, **pnpm**, or **bun** package manager
- A Firebase project (free tier works)

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd seo-survey-platform

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Fill in your Firebase config (see Firebase Setup below)

# 5. Start dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or select an existing one)
3. Follow the setup wizard (Analytics is optional)

### 2. Register a Web App

1. In your project, click **Settings ⚙️** → **"Project settings"**
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → **Web (</\>)**
4. Register with any nickname (e.g., "SEO Survey")
5. Copy the `firebaseConfig` object values into your `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Enable Firestore

1. In Firebase Console, navigate to **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select a region close to your users
5. Deploy the security rules (see below)

### 4. Deploy Firestore Security Rules

**Option A — Firebase Console:**
1. Go to **Firestore Database** → **"Rules"** tab
2. Paste the contents of `firestore.rules`
3. Click **"Publish"**

**Option B — Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Copy firestore.rules to the project root
firebase deploy --only firestore:rules
```

### 5. Generate Service Account Key (Optional)

Only needed if you add server-side Firestore operations later.

1. Go to **Project settings** → **"Service accounts"** tab
2. Click **"Generate new private key"**
3. Download the JSON file
4. Extract values into `.env`:

```env
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Never commit service account keys to git!** They are in `.gitignore`.

---

## Email Provider Setup (Resend)

Email notifications are sent to the admin when a survey is submitted.

### 1. Create a Resend Account

1. Sign up at [resend.com/signup](https://resend.com/signup)
2. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)

### 2. Verify Your Domain (Production)

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain and configure DNS records
3. Once verified, you can send from `@yourdomain.com`

For testing, use `onboarding@resend.dev` as the sender.

### 3. Configure Environment Variables

```env
RESEND_API_KEY=re_1234567890abcdef
EMAIL_FROM=survey@yourdomain.com
EMAIL_TO=admin@yourdomain.com
```

> If Resend is not configured, the app works normally — emails are logged to the server console instead.

---

## Environment Variables

| Variable | Side | Required | Description |
|----------|------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Client | Yes | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | Yes | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Client | Yes | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client | Yes | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client | Yes | Firebase Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Client | Yes | Firebase App ID |
| `VITE_APP_NAME` | Client | No | Public brand name of the app |
| `VITE_WHATSAPP_URL` | Client | No | WhatsApp contact link |
| `VITE_LINKEDIN_URL` | Client | No | LinkedIn profile link |
| `FIREBASE_PROJECT_ID` | Server | No* | Admin SDK project ID |
| `FIREBASE_CLIENT_EMAIL` | Server | No* | Admin SDK client email |
| `FIREBASE_PRIVATE_KEY` | Server | No* | Admin SDK private key |
| `RESEND_API_KEY` | Server | No | Resend API key for emails |
| `EMAIL_FROM` | Server | No | Sender email address |
| `EMAIL_TO` | Server | No | Admin notification recipient |

\* Only needed if you add server-side Firestore operations.

---

## How Survey Submission Works

```
User fills out survey
        │
        ▼
Click "Submit Survey"
        │
        ▼
React Hook Form validates current section
        │
        ▼
submitSurvey() called (src/lib/firebase.ts)
        │
        ├── 1. Structure flat form data → Firestore schema
        ├── 2. Resolve "Other" selections → custom text
        │       e.g., ["WordPress", "Other"] + other_text="Astro"
        │       → ["WordPress", "Astro"]
        ├── 3. Write to Firestore `surveyResponses` collection
        ├── 4. Fire-and-forget POST to /api/notify
        │       │
        │       ▼
        │   Server formats HTML email
        │   Server sends via Resend API
        │
        ▼
Show success "Thank you" screen
```

### Firestore Document Structure

```json
{
  "submittedAt": "SERVER_TIMESTAMP",
  "profile": {
    "role": "Freelancer",
    "scale": "6–20",
    "stack": ["WordPress", "Next.js"],
    "experience": "Advanced",
    "email": "user@example.com",
    "nameSuggestion": "OrbitSEO"
  },
  "workflow": {
    "tools": ["Ahrefs", "Screaming Frog"],
    "timeSink": "Reporting",
    "auditDuration": "1–3 hours",
    "frustration": "Too much manual work"
  },
  "aiTrust": {
    "hardestArea": "Combining all three effectively",
    "aiUsage": "Sometimes",
    "trustBlocker": ["Inaccurate recommendations", "Hallucinated fixes"],
    "codeAudit": "Extremely valuable"
  },
  "productValidation": {
    "unifiedValue": "Definitely",
    "features": ["AI-generated fixes", "GEO optimization"],
    "willingToPay": "Yes",
    "fixOneThing": "Better developer guidance",
    "wishlist": "Real-time monitoring dashboard"
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "submittedFrom": "https://yourdomain.com/survey",
    "locale": "en-US"
  }
}
```

---

## Deployment

### Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Set **Framework Preset** to **Vite**
4. Add all environment variables in **Settings → Environment Variables**
5. Deploy

> **Important:** Server-only variables (`RESEND_API_KEY`, `EMAIL_*`, `FIREBASE_*`) must be added without the `VITE_` prefix.

### Netlify

1. Push your code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) and import the repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in **Site settings → Environment variables**
6. Deploy

### Cloudflare Workers

The project includes `wrangler.jsonc` for Cloudflare deployment:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Add secrets
wrangler secret put RESEND_API_KEY
wrangler secret put EMAIL_FROM
wrangler secret put EMAIL_TO

# Deploy
npm run build
wrangler deploy
```

---

## Troubleshooting

### "Firebase not configured" warning in console
Your `VITE_FIREBASE_*` environment variables are missing or empty. The app will work but submissions are logged to the console instead of saved to Firestore.

### "Email skipped (not configured)" in server logs
`RESEND_API_KEY` or `EMAIL_TO` is not set. Emails will be logged instead of sent. This is expected during local development.

### Hydration errors
If you see React hydration mismatches, ensure your component renders are deterministic. The `CosmicBackground` uses `useMemo` to generate stable star positions.

### "Other" showing as literal text in Firestore
This was a known issue in the original codebase. The current implementation resolves "Other" to the user's custom text before writing to Firestore. Check `resolveOther()` in `src/lib/firebase.ts`.

### Build fails with duplicate plugin errors
The `vite.config.ts` was updated to remove `@lovable.dev/vite-tanstack-config`. If you still see duplicate plugin errors, ensure no other config is loading conflicting plugins.

### Favicon not showing
Place your favicon files in the `public/` directory:
- `favicon.ico` (32×32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180×180)

Generate from your logo at [realfavicongenerator.net](https://realfavicongenerator.net).

---

## Security Notes

- **API keys in client bundle:** Firebase client config (VITE_*) is embedded in the browser bundle. This is by design — Firebase security is enforced by Firestore Security Rules, not API key secrecy.
- **Server secrets:** `RESEND_API_KEY`, `EMAIL_*`, and `FIREBASE_*` (admin) never reach the client. They are only accessed in `src/routes/api/notify.ts`.
- **Firestore rules:** Only `create` is allowed on `surveyResponses`. No reads, updates, or deletes from the client SDK.

### Future Security Improvements

- **Rate limiting:** Add Firebase App Check or Cloudflare rate limiting to prevent spam submissions
- **CAPTCHA:** Integrate reCAPTCHA v3 or hCaptcha before form submission
- **IP tracking:** Log IP addresses in metadata for abuse detection
- **Content filtering:** Add server-side validation to reject obviously spam content

---

## Scripts

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

---

## License

This project is private and proprietary. All rights reserved.
#   s e o a i a g e n t s u r v e y  
 