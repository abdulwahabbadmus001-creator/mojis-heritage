export const UNAUTHORIZED_ADMIN_MESSAGE =
  "This account is not authorised for the Moji's Heritage newsroom.";

/**
 * Verifies whether a decoded Firebase ID token result carries the server-issued
 * `admin: true` custom claim required by both the newsroom UI and Firestore/Storage rules.
 */
export function hasAdminClaim(tokenResult) {
  return Boolean(
    tokenResult &&
      tokenResult.claims &&
      tokenResult.claims.admin === true
  );
}

/**
 * Inspects a Firebase Auth user and force-refreshes their ID token to check
 * for the `admin: true` custom claim.
 */
export async function verifyAdminUser(
  firebaseUser,
  { forceRefresh = true } = {}
) {
  if (!firebaseUser || typeof firebaseUser.getIdTokenResult !== "function") {
    return { authorized: false, claims: null };
  }
  const tokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
  const authorized = hasAdminClaim(tokenResult);
  return {
    authorized,
    claims: tokenResult?.claims || null,
  };
}

/**
 * Performs administrator sign-in and custom-claim verification.
 * Signs out immediately and throws UNAUTHORIZED_ADMIN_MESSAGE if the authenticated
 * account does not hold the `admin: true` custom claim.
 */
export async function authenticateAdminWithDeps({
  email,
  password,
  firebaseReadyFlag = false,
  authInstance = null,
  missingKeys = [],
  signInFn,
  signOutFn,
} = {}) {
  if (!firebaseReadyFlag || !authInstance) {
    const missingDetail =
      Array.isArray(missingKeys) && missingKeys.length > 0
        ? ` Missing required variable(s): ${missingKeys.join(", ")}.`
        : "";
    throw new Error(
      `Firebase is not configured. Check the Firebase values in your project's .env file.${missingDetail}`
    );
  }

  const credential = await signInFn(
    authInstance,
    String(email || "").trim(),
    password
  );

  const { authorized } = await verifyAdminUser(credential?.user, {
    forceRefresh: true,
  });

  if (!authorized) {
    await signOutFn(authInstance);
    throw new Error(UNAUTHORIZED_ADMIN_MESSAGE);
  }

  return credential;
}

/**
 * Determines the rendering state for AdminGate based on authentication
 * and custom-claim authorization status.
 */
export function evaluateAdminGateState({
  loading = false,
  firebaseReady = false,
  user = null,
  isAdmin = false,
} = {}) {
  if (loading) return "loading";
  if (!firebaseReady) return "setup";
  if (!user) return "unauthenticated";
  if (!isAdmin) return "denied";
  return "authorized";
}
