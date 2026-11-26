import {
  getApps,
  initializeApp
} from "firebase/app";

import {
  getAuth
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

import {
  getStorage
} from "firebase/storage";

import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "firebase/app-check";

/* ======================================================
   FIREBASE CONFIGURATION

   Values are loaded from Vite environment variables
   (VITE_FIREBASE_*).

   Never put administrator passwords, service-account
   private keys or other server secrets here.
====================================================== */

export const REQUIRED_FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

export const OPTIONAL_FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_RECAPTCHA_ENTERPRISE_SITE_KEY",
];

const PLACEHOLDER_PATTERNS = [
  /^your[-_]/i,
  /^replace[-_]/i,
  /^<.*>$/,
  /^undefined$/i,
  /^null$/i,
];

/**
 * Normalizes an environment variable string by stripping accidental
 * surrounding whitespace, trailing commas, and wrapping quotes.
 */
export function cleanEnvValue(value) {
  if (typeof value !== "string") return "";
  const cleaned = value
    .trim()
    .replace(/,+$/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!cleaned) return "";
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    return "";
  }
  return cleaned;
}

/**
 * Resolves and validates Firebase configuration from an environment object.
 * Identifies any missing required VITE_FIREBASE_* variable names without
 * exposing or logging configuration values.
 */
export function resolveFirebaseConfig(rawEnv = {}) {
  const source = rawEnv && typeof rawEnv === "object" ? rawEnv : {};

  const envValues = {
    VITE_FIREBASE_API_KEY: cleanEnvValue(source.VITE_FIREBASE_API_KEY),
    VITE_FIREBASE_AUTH_DOMAIN: cleanEnvValue(source.VITE_FIREBASE_AUTH_DOMAIN),
    VITE_FIREBASE_PROJECT_ID: cleanEnvValue(source.VITE_FIREBASE_PROJECT_ID),
    VITE_FIREBASE_STORAGE_BUCKET: cleanEnvValue(source.VITE_FIREBASE_STORAGE_BUCKET),
    VITE_FIREBASE_MESSAGING_SENDER_ID: cleanEnvValue(
      source.VITE_FIREBASE_MESSAGING_SENDER_ID
    ),
    VITE_FIREBASE_APP_ID: cleanEnvValue(source.VITE_FIREBASE_APP_ID),
  };

  const missingKeys = REQUIRED_FIREBASE_ENV_KEYS.filter(
    (key) => !envValues[key]
  );

  const config = {
    apiKey: envValues.VITE_FIREBASE_API_KEY,
    authDomain: envValues.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: envValues.VITE_FIREBASE_PROJECT_ID,
    storageBucket: envValues.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envValues.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: envValues.VITE_FIREBASE_APP_ID,
  };

  const ready = missingKeys.length === 0;
  const errorMessage = ready
    ? ""
    : `Firebase is not configured. Missing required environment variable(s): ${missingKeys.join(
        ", "
      )}. Check the Firebase values in your project's .env file.`;

  return {
    config,
    missingKeys,
    ready,
    errorMessage,
  };
}

const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : typeof process !== "undefined" && process.env
    ? process.env
    : {};

const resolved = resolveFirebaseConfig(env);
const firebaseConfig = resolved.config;

export const missingFirebaseEnvKeys = resolved.missingKeys;

/* ======================================================
   FIREBASE APP (SINGLETON INITIALIZATION)
====================================================== */

let initializedApp = null;
let initializationError = resolved.errorMessage;

if (resolved.ready) {
  try {
    initializedApp =
      getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  } catch (error) {
    initializedApp = null;
    initializationError =
      "Firebase initialization failed. Verify the VITE_FIREBASE_* values in your project's .env file.";
    if (env.DEV) {
      console.error("Firebase initialization error:", error?.message || error);
    }
  }
}

export const app = initializedApp;
export const firebaseReady = Boolean(resolved.ready && app);
export const isFirebaseConfigured = firebaseReady;
export const firebaseConfigError = initializationError;

/* ======================================================
   FIREBASE SERVICES
====================================================== */

export const auth = app ? getAuth(app) : null;

export const db = app ? getFirestore(app) : null;

export const storage = app ? getStorage(app) : null;

/* ======================================================
   APP CHECK

   App Check is only initialized once when a reCAPTCHA
   Enterprise site key exists.
====================================================== */

const recaptchaSiteKey = cleanEnvValue(
  env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
);

let appCheckInitialized = false;

if (app && recaptchaSiteKey && !appCheckInitialized) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  } catch (error) {
    /*
     * Vite hot reload can attempt Firebase App Check
     * initialization more than once during development.
     */
    if (env.DEV) {
      console.warn(
        "Firebase App Check was not re-initialized.",
        error?.message || error
      );
    }
  }
}
