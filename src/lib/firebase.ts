import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return (
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.authDomain
  );
}

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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

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
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}