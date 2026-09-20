import { Bookmark } from "lucide-react";
import { useSavedPosts } from "../../hooks/useSavedPosts";

export default function SaveButton({ postId }) {
  const { isSaved, toggleSaved } = useSavedPosts();

  const saved = isSaved(postId);

  return (
    <button
      className="btn outline"
      onClick={() => toggleSaved(postId)}
      aria-pressed={saved}
    >
      <Bookmark size={17} />
      {saved ? "Saved" : "Save for later"}
    </button>
  );
}