import {
  useCallback,
  useEffect,
  useState
} from "react";

const STORAGE_KEY =
  "mojisHeritageSavedPosts";

function readSavedPosts() {
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

export function useSavedPosts() {
  const [saved, setSaved] = useState(
    readSavedPosts
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(saved)
    );
  }, [saved]);

  const isSaved = useCallback(
    (postId) => {
      return saved.includes(postId);
    },
    [saved]
  );

  const savePost = useCallback(
    (postId) => {
      setSaved((current) => {
        if (current.includes(postId)) {
          return current;
        }

        return [...current, postId];
      });
    },
    []
  );

  const removeSavedPost = useCallback(
    (postId) => {
      setSaved((current) =>
        current.filter(
          (id) => id !== postId
        )
      );
    },
    []
  );

  const toggleSaved = useCallback(
    (postId) => {
      setSaved((current) =>
        current.includes(postId)
          ? current.filter(
              (id) => id !== postId
            )
          : [...current, postId]
      );
    },
    []
  );

  const clearSaved = useCallback(() => {
    setSaved([]);
  }, []);

  return {
    saved,
    isSaved,
    savePost,
    removeSavedPost,
    toggleSaved,
    clearSaved
  };
}