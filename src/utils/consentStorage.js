export const CONSENT_STORAGE_KEY = "mojis-consent-preferences";
export const CONSENT_VERSION = "2026.1";
export const THEME_STORAGE_KEY = "mojis-theme";
export const RECENTLY_VIEWED_KEY = "mojisHeritageRecentlyViewed";
export const SAVED_POSTS_KEY = "mojisHeritageSavedPosts";

export const DEFAULT_CONSENT_CHOICES = Object.freeze({
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false
});

/**
 * Safely reads and validates the visitor's theme from localStorage.
 * Recovers gracefully to "archives" if storage is unavailable or corrupted.
 */
export function readValidTheme(
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  try {
    if (!storage) return "archives";
    const raw = storage.getItem(THEME_STORAGE_KEY);
    if (raw === "noir" || raw === "archives") {
      return raw;
    }
    if (raw !== null) {
      storage.setItem(THEME_STORAGE_KEY, "archives");
    }
    return "archives";
  } catch {
    return "archives";
  }
}

/**
 * Safely writes a validated theme ("archives" | "noir") to localStorage.
 */
export function writeValidTheme(
  theme,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  const safeTheme = theme === "noir" ? "noir" : "archives";
  try {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", safeTheme);
    }
    if (storage) {
      storage.setItem(THEME_STORAGE_KEY, safeTheme);
    }
  } catch {
    // Ignore storage quota or security restrictions
  }
  return safeTheme;
}

/**
 * Safely parses stored consent state.
 * If missing, malformed, or from an older policy version, returns hasDecided: false
 * with all optional categories disabled by default.
 */
export function readConsentState(
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  try {
    if (!storage) {
      return {
        hasDecided: false,
        version: CONSENT_VERSION,
        updatedAt: null,
        choices: { ...DEFAULT_CONSENT_CHOICES }
      };
    }

    const raw = storage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return {
        hasDecided: false,
        version: CONSENT_VERSION,
        updatedAt: null,
        choices: { ...DEFAULT_CONSENT_CHOICES }
      };
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== CONSENT_VERSION ||
      !parsed.choices ||
      typeof parsed.choices !== "object" ||
      typeof parsed.choices.preferences !== "boolean" ||
      typeof parsed.choices.analytics !== "boolean" ||
      typeof parsed.choices.marketing !== "boolean"
    ) {
      try {
        storage.removeItem(CONSENT_STORAGE_KEY);
      } catch {
        // Ignore
      }
      return {
        hasDecided: false,
        version: CONSENT_VERSION,
        updatedAt: null,
        choices: { ...DEFAULT_CONSENT_CHOICES }
      };
    }

    return {
      hasDecided: true,
      version: CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      choices: {
        necessary: true,
        preferences: Boolean(parsed.choices.preferences),
        analytics: Boolean(parsed.choices.analytics),
        marketing: Boolean(parsed.choices.marketing)
      }
    };
  } catch {
    try {
      storage?.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    return {
      hasDecided: false,
      version: CONSENT_VERSION,
      updatedAt: null,
      choices: { ...DEFAULT_CONSENT_CHOICES }
    };
  }
}

/**
 * Writes a validated consent decision and enforces cleanup when optional
 * categories are disabled or withdrawn.
 */
export function writeConsentState(
  nextChoices,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  const normalizedChoices = {
    necessary: true,
    preferences: Boolean(nextChoices?.preferences),
    analytics: Boolean(nextChoices?.analytics),
    marketing: Boolean(nextChoices?.marketing)
  };

  const record = {
    hasDecided: true,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    choices: normalizedChoices
  };

  try {
    if (storage) {
      storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      if (!normalizedChoices.preferences) {
        storage.removeItem(RECENTLY_VIEWED_KEY);
      }
    }
  } catch {
    // Ignore storage errors in restricted environments
  }

  return record;
}

/**
 * Synchronous helper for services/hooks to check if a given category is consented.
 */
export function hasConsentFor(
  category,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (category === "necessary") return true;
  const state = readConsentState(storage);
  if (!state.hasDecided) return false;
  return Boolean(state.choices[category]);
}
