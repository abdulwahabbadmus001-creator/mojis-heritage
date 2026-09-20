export function readingTime(text = "") {
  if (!text) {
    return "1 min read";
  }

  const words = String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(
    1,
    Math.ceil(words / 220)
  );

  return `${minutes} min read`;
}