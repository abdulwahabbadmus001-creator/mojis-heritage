/**
 * Centralised Route Configuration for Moji's Heritage
 *
 * The administrative newsroom uses a non-predictable route segment rather than
 * `/admin` as a privacy-in-depth measure to reduce automated bot and scanner noise.
 *
 * IMPORTANT SECURITY NOTE:
 * Route obscurity is NOT authentication or authorization. Real access control is
 * enforced by Firebase Authentication + verified `admin === true` custom claims in
 * `src/context/Auth.jsx` (`AdminGate`) and server-side in `firestore.rules` / `storage.rules`.
 */

export const ADMIN_ROUTE_SEGMENT = "mh-newsroom-7f4c9a2e8b1d";
export const ADMIN_BASE_PATH = `/${ADMIN_ROUTE_SEGMENT}`;

/**
 * Builds an internal path inside the administrative dashboard.
 * @param {string} [subpath=""] - Optional child route (e.g., "posts", "submissions")
 * @returns {string} Full admin route path
 */
export function adminPath(subpath = "") {
  const cleaned = String(subpath || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  return cleaned ? `${ADMIN_BASE_PATH}/${cleaned}` : ADMIN_BASE_PATH;
}

/**
 * Legacy predictable admin paths that must remain permanently unmapped / 404.
 */
export const LEGACY_BLOCKED_ADMIN_PATHS = ["/admin", "/admin/*"];
