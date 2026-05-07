/**
 * Firebase Client SDK — Browser-side Initialization
 * ===================================================
 * This module ONLY handles Firebase app + Firestore initialization.
 * It exports the singleton Firestore instance for use by other client modules.
 *
 * IMPORTANT: This file must NOT contain any business logic, payload
 * structuring, or server imports. It is purely infrastructure.
 *
 * ENVIRONMENT VARIABLES (client-safe, prefixed with VITE_):
 * These are embedded in the client bundle — they are NOT secrets.
 * Firebase security is enforced via Firestore Security Rules.
 *
 * Get these values from: Firebase Console → Project Settings → Your Apps
 *   VITE_FIREBASE_API_KEY             → "Web API Key"
 *   VITE_FIREBASE_AUTH_DOMAIN         → "<project-id>.firebaseapp.com"
 *   VITE_FIREBASE_PROJECT_ID          → Project ID
 *   VITE_FIREBASE_STORAGE_BUCKET      → "<project-id>.firebasestorage.app"
 *   VITE_FIREBASE_MESSAGING_SENDER_ID → "Sender ID" under Cloud Messaging tab
 *   VITE_FIREBASE_APP_ID              → "App ID" under your web app config
 *
 * @see https://firebase.google.com/docs/web/setup
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Firebase configuration — sourced from environment variables
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// --- Runtime Env Debugging (Requested) ---
if (import.meta.env.DEV) {
  console.log("FULL ENV", import.meta.env);
  console.log("FIREBASE ENV CHECK", {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
}


// ---------------------------------------------------------------------------
// Runtime environment validation
// ---------------------------------------------------------------------------

/**
 * Returns true if the minimum required Firebase env vars are present.
 * apiKey + projectId + authDomain are the bare minimum for Firestore.
 */
export function isFirebaseConfigured(): boolean {
  return (
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.authDomain
  );
}

/**
 * Logs the current Firebase environment variable state for debugging.
 * Call this during development to verify .env.local is loading correctly.
 */
export function debugFirebaseEnv(): void {
  console.log("[firebase] Environment variable check:", {
    apiKey: firebaseConfig.apiKey ? "✓ set" : "✗ MISSING",
    authDomain: firebaseConfig.authDomain ? "✓ set" : "✗ MISSING",
    projectId: firebaseConfig.projectId ? "✓ set" : "✗ MISSING",
    storageBucket: firebaseConfig.storageBucket ? "✓ set" : "✗ MISSING",
    messagingSenderId: firebaseConfig.messagingSenderId ? "✓ set" : "✗ MISSING",
    appId: firebaseConfig.appId ? "✓ set" : "✗ MISSING",
  });
}

// ---------------------------------------------------------------------------
// Singleton initialization — prevents duplicate Firebase apps in HMR/SSR
// ---------------------------------------------------------------------------

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/**
 * Returns the Firebase app instance, creating it if it doesn't exist.
 * Uses getApps() to avoid re-initialization errors during HMR.
 *
 * @throws Error if Firebase is not configured (env vars missing)
 */
export function getApp(): FirebaseApp {
  if (!app) {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "[firebase] Cannot initialize — VITE_FIREBASE_API_KEY, " +
        "VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID " +
        "must be set in .env.local"
      );
    }
    const existing = getApps();
    app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
    console.log("[firebase] App initialized for project:", firebaseConfig.projectId);
  }
  return app;
}

/**
 * Returns the Firestore database instance.
 *
 * @throws Error if Firebase is not configured
 */
export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}
