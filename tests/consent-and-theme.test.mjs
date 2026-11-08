import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  THEME_STORAGE_KEY,
  RECENTLY_VIEWED_KEY,
  readConsentState,
  writeConsentState,
  hasConsentFor,
  readValidTheme,
  writeValidTheme
} from "../src/utils/consentStorage.js";

import {
  addRecentlyViewed,
  getRecentlyViewed
} from "../src/hooks/useRecentlyViewed.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    }
  };
}

test("Scenario 1: First visit defaults optional categories to disabled and blocks optional storage", () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  const state = readConsentState(storage);
  assert.equal(state.hasDecided, false);
  assert.equal(state.choices.necessary, true);
  assert.equal(state.choices.preferences, false);
  assert.equal(state.choices.analytics, false);
  assert.equal(state.choices.marketing, false);

  assert.equal(hasConsentFor("necessary", storage), true);
  assert.equal(hasConsentFor("preferences", storage), false);
  assert.equal(hasConsentFor("analytics", storage), false);
  assert.equal(hasConsentFor("marketing", storage), false);

  // Attempting to record recently viewed before consent must not write to storage
  addRecentlyViewed({ id: "aso-oke", title: "Aso-Oke" });
  assert.equal(storage.getItem(RECENTLY_VIEWED_KEY), null);
  assert.deepEqual(getRecentlyViewed(), []);
});

test("Scenario 2: Reject optional categories persists decision across refresh", () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  writeConsentState(
    { preferences: false, analytics: false, marketing: false },
    storage
  );

  const afterRefresh = readConsentState(storage);
  assert.equal(afterRefresh.hasDecided, true);
  assert.equal(afterRefresh.version, CONSENT_VERSION);
  assert.ok(afterRefresh.updatedAt);
  assert.deepEqual(afterRefresh.choices, {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false
  });
});

test("Scenario 3: Accept optional categories enables selected categories and allows preference storage", () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  writeConsentState(
    { preferences: true, analytics: true, marketing: false },
    storage
  );

  assert.equal(hasConsentFor("preferences", storage), true);
  assert.equal(hasConsentFor("analytics", storage), true);
  assert.equal(hasConsentFor("marketing", storage), false);

  addRecentlyViewed({ id: "benin", title: "A Short History of the Benin Kingdom" });
  const recent = getRecentlyViewed();
  assert.equal(recent.length, 1);
  assert.equal(recent[0].id, "benin");
});

test("Scenario 4 & 5: Customize preferences and reopen preferences displays exact saved choices", () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  writeConsentState(
    { preferences: false, analytics: true, marketing: false },
    storage
  );

  const reopened = readConsentState(storage);
  assert.equal(reopened.hasDecided, true);
  assert.equal(reopened.choices.preferences, false);
  assert.equal(reopened.choices.analytics, true);
  assert.equal(reopened.choices.marketing, false);
});

test("Scenario 6: Withdraw consent disables optional categories and purges recently viewed storage", () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  // First accept preferences and record a story
  writeConsentState(
    { preferences: true, analytics: true, marketing: false },
    storage
  );
  addRecentlyViewed({ id: "durbar", title: "The Durbar Tradition" });
  assert.equal(getRecentlyViewed().length, 1);

  // Now withdraw optional consent
  writeConsentState(
    { preferences: false, analytics: false, marketing: false },
    storage
  );

  assert.equal(hasConsentFor("preferences", storage), false);
  assert.equal(hasConsentFor("analytics", storage), false);
  assert.equal(storage.getItem(RECENTLY_VIEWED_KEY), null);
  assert.deepEqual(getRecentlyViewed(), []);
});

test("Scenario 7: Corrupted or outdated saved preference recovers safely", () => {
  const storage = createMemoryStorage();
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  storage.setItem(CONSENT_STORAGE_KEY, "{not-valid-json");
  const fromBadJson = readConsentState(storage);
  assert.equal(fromBadJson.hasDecided, false);
  assert.equal(fromBadJson.choices.preferences, false);
  assert.equal(storage.getItem(CONSENT_STORAGE_KEY), null);

  storage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({ version: "old-version", choices: { preferences: true } })
  );
  const fromOldVersion = readConsentState(storage);
  assert.equal(fromOldVersion.hasDecided, false);
  assert.equal(fromOldVersion.choices.preferences, false);
});

test("Scenario 8: Theme switching works independently of optional consent and recovers from corrupted values", () => {
  const storage = createMemoryStorage();
  let attrValue = null;
  globalThis.document = {
    documentElement: {
      setAttribute(name, val) {
        if (name === "data-theme") attrValue = val;
      }
    }
  };
  globalThis.window = { localStorage: storage };
  globalThis.localStorage = storage;

  // Reject all optional consent
  writeConsentState(
    { preferences: false, analytics: false, marketing: false },
    storage
  );

  // Theme switch to Gallery Noir still works and persists
  const applied = writeValidTheme("noir", storage);
  assert.equal(applied, "noir");
  assert.equal(attrValue, "noir");
  assert.equal(readValidTheme(storage), "noir");

  // Corrupted theme value recovers safely to "archives"
  storage.setItem(THEME_STORAGE_KEY, "invalid-corrupted-theme");
  assert.equal(readValidTheme(storage), "archives");
  assert.equal(storage.getItem(THEME_STORAGE_KEY), "archives");
});

test("Static verification: Routes, Privacy & Cookie Policy, and Historical Integrity", () => {
  const appCode = fs.readFileSync(path.resolve("src/App.jsx"), "utf8");
  const publicCode = fs.readFileSync(path.resolve("src/pages/Public.jsx"), "utf8");

  assert.ok(appCode.includes('path="/privacy"'), "Privacy route exists");
  assert.ok(appCode.includes('path="/cookies"'), "Cookies route exists");
  assert.ok(publicCode.includes("export function CookiePolicy()"), "CookiePolicy component exported");
  assert.ok(!publicCode.includes("CAT. NG-NOK-01"), "Fabricated catalog IDs removed");
});
