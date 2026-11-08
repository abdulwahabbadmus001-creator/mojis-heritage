import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Link } from "react-router-dom";

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  THEME_STORAGE_KEY,
  RECENTLY_VIEWED_KEY,
  SAVED_POSTS_KEY,
  DEFAULT_CONSENT_CHOICES,
  readValidTheme,
  writeValidTheme,
  readConsentState,
  writeConsentState,
  hasConsentFor
} from "../utils/consentStorage.js";

export {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  THEME_STORAGE_KEY,
  RECENTLY_VIEWED_KEY,
  SAVED_POSTS_KEY,
  DEFAULT_CONSENT_CHOICES,
  readValidTheme,
  writeValidTheme,
  readConsentState,
  writeConsentState,
  hasConsentFor
};

const ConsentContext = createContext(null);

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used inside ConsentProvider.");
  }
  return context;
}

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readConsentState());
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const acceptAllOptional = useCallback(() => {
    const updated = writeConsentState({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: false
    });
    setConsent(updated);
    setIsManagerOpen(false);
  }, []);

  const rejectOptional = useCallback(() => {
    const updated = writeConsentState({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false
    });
    setConsent(updated);
    setIsManagerOpen(false);
  }, []);

  const saveCustomPreferences = useCallback((customChoices) => {
    const updated = writeConsentState(customChoices);
    setConsent(updated);
    setIsManagerOpen(false);
  }, []);

  const openPreferencesManager = useCallback(() => {
    setIsManagerOpen(true);
  }, []);

  const closePreferencesManager = useCallback(() => {
    // Closing the manager without saving does not grant consent
    setIsManagerOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      hasDecided: consent.hasDecided,
      choices: consent.choices,
      updatedAt: consent.updatedAt,
      isManagerOpen,
      acceptAllOptional,
      rejectOptional,
      saveCustomPreferences,
      openPreferencesManager,
      closePreferencesManager
    }),
    [
      consent,
      isManagerOpen,
      acceptAllOptional,
      rejectOptional,
      saveCustomPreferences,
      openPreferencesManager,
      closePreferencesManager
    ]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <ConsentBannerAndModal />
    </ConsentContext.Provider>
  );
}

function ConsentBannerAndModal() {
  const {
    hasDecided,
    choices,
    updatedAt,
    isManagerOpen,
    acceptAllOptional,
    rejectOptional,
    saveCustomPreferences,
     openPreferencesManager,
    closePreferencesManager
  } = useConsent();

  const [draftPreferences, setDraftPreferences] = useState(choices.preferences);
  const [draftAnalytics, setDraftAnalytics] = useState(choices.analytics);
  const [draftMarketing, setDraftMarketing] = useState(choices.marketing);

  const dialogRef = useRef(null);
  const firstControlRef = useRef(null);

  useEffect(() => {
    if (isManagerOpen) {
      setDraftPreferences(Boolean(choices.preferences));
      setDraftAnalytics(Boolean(choices.analytics));
      setDraftMarketing(Boolean(choices.marketing));
    }
  }, [isManagerOpen, choices]);

  useEffect(() => {
    if (!isManagerOpen) return undefined;

    const timer = window.setTimeout(() => {
      firstControlRef.current?.focus();
    }, 20);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreferencesManager();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isManagerOpen, closePreferencesManager]);

  function handleSaveForm(event) {
    event.preventDefault();
    saveCustomPreferences({
      necessary: true,
      preferences: draftPreferences,
      analytics: draftAnalytics,
      marketing: draftMarketing
    });
  }

  const showBanner = !hasDecided && !isManagerOpen;

  if (!showBanner && !isManagerOpen) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <aside
          className="consent-banner glass-surface"
          role="region"
          aria-label="Cookie and browser storage preferences"
        >
          <div className="container consent-banner-inner">
            <div className="consent-banner-copy">
              <span className="mono-eyebrow">PRIVACY &amp; BROWSER STORAGE</span>
              <h2 className="heading consent-banner-title">
                Your Privacy Choices on Moji&apos;s Heritage
              </h2>
              <p>
                We use strictly necessary browser storage to remember your privacy
                settings, keep your chosen display theme (<em>Archives</em> or{" "}
                <em>Gallery Noir</em>), and store stories you explicitly bookmark.
                With your permission, we also use optional local storage to remember
                your recently viewed stories and count anonymous article reads. We do
                not use advertising or cross-site tracking cookies. Read our{" "}
                <Link to="/privacy" className="text-link">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link to="/cookies" className="text-link">
                  Cookie &amp; Storage Policy
                </Link>
                .
              </p>
            </div>

            <div className="consent-banner-actions">
              <button
                type="button"
                className="btn consent-btn-equal"
                onClick={rejectOptional}
              >
                Reject Optional
              </button>

              <button
                type="button"
                className="btn consent-btn-equal"
                onClick={acceptAllOptional}
              >
                Accept Optional
              </button>

              <button
                type="button"
                className="btn consent-btn-manage"
                onClick={openPreferencesManager}
              >
                Manage Preferences
              </button>
            </div>
          </div>
        </aside>
      )}

      {isManagerOpen && (
        <div
          className="consent-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePreferencesManager();
            }
          }}
        >
          <div
            ref={dialogRef}
            className="consent-modal glass-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-dialog-title"
            aria-describedby="consent-dialog-desc"
          >
            <div className="consent-modal-header">
              <div>
                <span className="mono-eyebrow">STORAGE &amp; PRIVACY CONTROLS</span>
                <h2 id="consent-dialog-title" className="heading">
                  Manage Cookie &amp; Browser Storage Preferences
                </h2>
              </div>

              <button
                ref={firstControlRef}
                type="button"
                className="btn consent-close-btn"
                onClick={closePreferencesManager}
                aria-label="Close preferences without saving changes"
              >
                ✕
              </button>
            </div>

            <p id="consent-dialog-desc" className="muted consent-modal-intro">
              Choose which optional browser storage and measurement features you allow
              on Moji&apos;s Heritage. Dismissing this window without saving keeps
              your existing state unchanged (optional categories default to disabled).
              {updatedAt && (
                <span className="consent-timestamp">
                  {" "}
                  Last saved: {new Date(updatedAt).toLocaleString()} (Policy v
                  {CONSENT_VERSION})
                </span>
              )}
            </p>

            <form onSubmit={handleSaveForm} className="consent-category-list">
              {/* 1. Strictly Necessary */}
              <div className="consent-category-item">
                <div className="consent-category-head">
                  <div>
                    <strong>1. Strictly Necessary Storage</strong>
                    <span className="consent-status-pill always-on">
                      Always Active
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked
                    disabled
                    aria-label="Strictly Necessary Storage (Always Active)"
                  />
                </div>
                <p className="muted">
                  Required for core website operation and security. Stores your
                  privacy decision (<code>{CONSENT_STORAGE_KEY}</code>), your selected
                  visual theme (<code>{THEME_STORAGE_KEY}</code>), stories you
                  explicitly click to bookmark (<code>{SAVED_POSTS_KEY}</code>), and
                  Firebase administrator authentication / abuse prevention.
                </p>
              </div>

              {/* 2. Preferences */}
              <div className="consent-category-item">
                <div className="consent-category-head">
                  <label htmlFor="consent-pref-toggle">
                    <strong>2. Preferences &amp; Reading History</strong>
                  </label>
                  <input
                    id="consent-pref-toggle"
                    type="checkbox"
                    checked={draftPreferences}
                    onChange={(event) =>
                      setDraftPreferences(event.target.checked)
                    }
                  />
                </div>
                <p className="muted">
                  Allows your browser to automatically remember up to 6 recently
                  viewed stories in local storage (
                  <code>{RECENTLY_VIEWED_KEY}</code>) so you can resume reading on
                  your next visit. Turning this off clears your recently viewed list.
                </p>
              </div>

              {/* 3. Analytics */}
              <div className="consent-category-item">
                <div className="consent-category-head">
                  <label htmlFor="consent-analytics-toggle">
                    <strong>3. Analytics &amp; Story View Measurement</strong>
                  </label>
                  <input
                    id="consent-analytics-toggle"
                    type="checkbox"
                    checked={draftAnalytics}
                    onChange={(event) =>
                      setDraftAnalytics(event.target.checked)
                    }
                  />
                </div>
                <p className="muted">
                  Allows Moji&apos;s Heritage to increment anonymous story view
                  counters in Firebase Firestore when you open an article, helping
                  editors understand which cultural topics are read. No third-party
                  analytics trackers (such as Google Analytics) are used.
                </p>
              </div>

              {/* 4. Marketing */}
              <div className="consent-category-item">
                <div className="consent-category-head">
                  <label htmlFor="consent-marketing-toggle">
                    <strong>4. Marketing &amp; Advertising Technologies</strong>
                    <span className="consent-status-pill">Not Used</span>
                  </label>
                  <input
                    id="consent-marketing-toggle"
                    type="checkbox"
                    checked={draftMarketing}
                    onChange={(event) =>
                      setDraftMarketing(event.target.checked)
                    }
                  />
                </div>
                <p className="muted">
                  Moji&apos;s Heritage does not run third-party advertising networks
                  or marketing tracking pixels. External links (such as YouTube,
                  OpenStreetMap tiles on the Visit map, and social sharing links) are
                  used only when you interact with those features.
                </p>
              </div>

              <div className="consent-modal-footer">
                <button
                  type="button"
                  className="btn consent-btn-equal"
                  onClick={rejectOptional}
                >
                  Reject Optional
                </button>

                <button
                  type="button"
                  className="btn consent-btn-equal"
                  onClick={acceptAllOptional}
                >
                  Accept All Optional
                </button>

                <button type="submit" className="btn primary">
                  Save Selected Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
