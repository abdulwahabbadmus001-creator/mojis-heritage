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

   Values are loaded from the root .env file.

   Never put administrator passwords, service-account
   private keys or other server secrets here.
====================================================== */

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID
};

/* ======================================================
   CONFIGURATION CHECK
====================================================== */

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

/* ======================================================
   FIREBASE APP
====================================================== */

const app = firebaseReady
  ? getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export { app };

/* ======================================================
   FIREBASE SERVICES
====================================================== */

export const auth = app
  ? getAuth(app)
  : null;

export const db = app
  ? getFirestore(app)
  : null;

export const storage = app
  ? getStorage(app)
  : null;

/* ======================================================
   APP CHECK

   App Check is only initialized when a reCAPTCHA
   Enterprise site key exists.

   This lets local development continue before App Check
   is configured.
====================================================== */

const recaptchaSiteKey =
  import.meta.env
    .VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;

if (
  app &&
  recaptchaSiteKey
) {
  try {
    initializeAppCheck(app, {
      provider:
        new ReCaptchaEnterpriseProvider(
          recaptchaSiteKey
        ),

      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    /*
     * Vite hot reload can attempt Firebase App Check
     * initialization more than once during development.
     *
     * We intentionally avoid crashing the application
     * when that happens.
     */
    if (import.meta.env.DEV) {
      console.warn(
        "Firebase App Check was not re-initialized.",
        error
      );
    }
  }
}