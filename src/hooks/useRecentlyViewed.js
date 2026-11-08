import { hasConsentFor } from "../utils/consentStorage.js";

const STORAGE_KEY =
  "mojisHeritageRecentlyViewed";

const MAX_ITEMS = 6;

function readItems() {
  if (!hasConsentFor("preferences")) {
    return [];
  }

  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(post) {
  if (!post?.id || !hasConsentFor("preferences")) {
    return;
  }

  const current = readItems();

  const withoutCurrent =
    current.filter(
      (item) => item.id !== post.id
    );

  const newItem = {
    id: post.id,
    title: post.title,
    summary: post.summary || "",
    coverImage: post.coverImage || "",
    category: post.category || "",
    ethnicGroup:
      post.ethnicGroup || "",
    viewedAt: new Date().toISOString()
  };

  const next = [
    newItem,
    ...withoutCurrent
  ].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch {
    // Ignore storage quota or security restrictions
  }
}

export function getRecentlyViewed() {
  return readItems();
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
}