const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\b[^#]*?[?&]v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/live\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/v\/)([\w-]{11})/,
];

/** Extracts an 11-char YouTube video id from any common URL shape (or bare id). */
export const parseYouTubeId = (input: string): string | null => {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};
