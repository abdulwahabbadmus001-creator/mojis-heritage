/**
 * URL Safety & Scheme Sanitization Utilities
 *
 * Prevents XSS and dangerous URI scheme injection (`javascript:`, `data:`,
 * `vbscript:`, `file:`) across user-contributed records, external API payloads,
 * Markdown content, and media previews.
 */

const ALLOWED_HTTP_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Checks whether a URL string uses a safe HTTP/HTTPS scheme (or an optional
 * relative path starting with `/`).
 *
 * @param {string} rawUrl
 * @param {{ allowRelative?: boolean }} [options]
 * @returns {boolean}
 */
export function isSafeHttpUrl(rawUrl, { allowRelative = false } = {}) {
  if (typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Strip ASCII control characters and whitespace before scheme inspection
  const normalized = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (!normalized) return false;

  // Reject dangerous schemes explicitly
  if (/^(javascript|data|vbscript|file|blob):/i.test(normalized)) {
    return false;
  }

  if (allowRelative && /^\/(?!\/)/.test(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_HTTP_PROTOCOLS.has(parsed.protocol.toLowerCase()) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Returns the trimmed URL if it passes `isSafeHttpUrl`, or `fallback` otherwise.
 *
 * @param {string} rawUrl
 * @param {string} [fallback=""]
 * @param {{ allowRelative?: boolean }} [options]
 * @returns {string}
 */
export function sanitizeHttpUrl(rawUrl, fallback = "", options = {}) {
  if (typeof rawUrl !== "string") return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;
  return isSafeHttpUrl(trimmed, options) ? trimmed : fallback;
}
