// YouTube transcript crawler — fast, reliable, serverless-friendly.
//
// Strategy: watch-page scrape extracts caption track URLs from
// ytInitialPlayerResponse. YouTube blocks datacenter IPs from the timedtext
// endpoint (returns 200 with empty body), so we race direct fetch vs CORS
// proxies simultaneously and take the first non-empty response.

const WATCH_URL = "https://www.youtube.com/watch";

// CORS proxies fetch from their own IPs (not blocked by YouTube).
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

const PAGE_TIMEOUT_MS = 8_000;
const CAPTION_TIMEOUT_MS = 8_000;
const MAX_TRANSCRIPT_CHARS = 80_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  segments: TranscriptSegment[];
  language: string;
  source: "watch-page" | "proxy" | "fallback-api";
}

export class TranscriptError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "TranscriptError";
    this.status = status;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Video ID extraction
// ---------------------------------------------------------------------------

const VIDEO_ID_RE = /^[\w-]{11}$/;
const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\b[^#]*?[?&]v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/live\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/v\/)([\w-]{11})/,
];

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
};

export function decodeHtmlEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const code = parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    if (body.startsWith("#")) {
      const code = parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

export function cleanCaptionText(raw: string): string {
  return decodeHtmlEntities(raw).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function extractJsonAfter(html: string, marker: string): unknown | null {
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;
  const openBrace = html.indexOf("{", startIdx + marker.length);
  if (openBrace === -1) return null;
  let depth = 0, inString = false, escaped = false;
  for (let i = openBrace; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try { return JSON.parse(html.slice(openBrace, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Caption parsers
// ---------------------------------------------------------------------------

interface Json3Event {
  tStartMs?: number; dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

function parseJson3(body: string): TranscriptSegment[] | null {
  try {
    const data = JSON.parse(body) as { events?: Json3Event[] };
    if (!Array.isArray(data.events)) return null;
    const segments: TranscriptSegment[] = [];
    for (const event of data.events) {
      if (!event.segs) continue;
      const text = cleanCaptionText(event.segs.map((s) => s.utf8 ?? "").join(""));
      if (!text || text === "\n") continue;
      segments.push({
        text,
        start: (event.tStartMs ?? 0) / 1000,
        duration: (event.dDurationMs ?? 0) / 1000,
      });
    }
    return segments.length > 0 ? segments : null;
  } catch { return null; }
}

function parseTimedTextXml(body: string): TranscriptSegment[] | null {
  if (!body.includes("<text")) return null;
  const segments: TranscriptSegment[] = [];
  const re = /<text([^>]*)>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const attrs = match[1];
    const text = cleanCaptionText(match[2]);
    if (!text) continue;
    const start = Number(attrs.match(/start="([\d.]+)"/)?.[1] ?? 0);
    const duration = Number(attrs.match(/dur="([\d.]+)"/)?.[1] ?? 0);
    segments.push({ text, start, duration });
  }
  return segments.length > 0 ? segments : null;
}

// ---------------------------------------------------------------------------
// Caption content fetch — races direct + proxies in parallel
// ---------------------------------------------------------------------------

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
}

interface PlayerResponseShape {
  captions?: {
    playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
  };
  playabilityStatus?: { status?: string };
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  const english = tracks.find((t) => t.languageCode?.startsWith("en") && t.kind !== "asr");
  const englishAsr = tracks.find((t) => t.languageCode?.startsWith("en"));
  return english ?? englishAsr ?? tracks[0];
}

/**
 * Try fetching caption content from multiple sources simultaneously.
 * YouTube blocks datacenter IPs (returns empty body), so we race direct
 * fetch against CORS proxies and take the first non-empty response.
 */
async function fetchCaptionContent(
  baseUrl: string,
): Promise<TranscriptSegment[] | null> {
  const cleanUrl = baseUrl.replace(/^http:/, "https:");

  for (const suffix of ["&fmt=json3", ""]) {
    const fullUrl = `${cleanUrl}${suffix}`;

    // Build all fetch attempts for this URL
    const attempts: Array<Promise<string>> = [
      // Direct fetch
      fetchWithTimeout(fullUrl, {
        headers: { "User-Agent": BROWSER_UA },
      }, CAPTION_TIMEOUT_MS)
        .then((r) => r.ok ? r.text() : "")
        .catch(() => ""),
      // CORS proxies
      ...CORS_PROXIES.map((proxyFn) =>
        fetchWithTimeout(proxyFn(fullUrl), {
          headers: { "User-Agent": BROWSER_UA },
        }, CAPTION_TIMEOUT_MS)
          .then((r) => r.ok ? r.text() : "")
          .catch(() => ""),
      ),
    ];

    // Race all attempts — first non-empty body wins
    const results = await Promise.allSettled(attempts);
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const body = result.value;
      if (!body || body.length === 0) continue;

      // Try both parsers regardless of suffix — proxies may return either format
      const segments = parseJson3(body) ?? parseTimedTextXml(body);
      if (segments && segments.length > 0) return segments;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Strategy: watch-page scrape
// ---------------------------------------------------------------------------

async function fetchViaWatchPage(
  videoId: string,
): Promise<TranscriptSegment[] | null> {
  const res = await fetchWithTimeout(
    `${WATCH_URL}?v=${videoId}&hl=en&has_verified=1`,
    {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "CONSENT=YES+cb; SOCS=CAI",
      },
    },
    PAGE_TIMEOUT_MS,
  );
  if (!res.ok) return null;

  const html = await res.text();
  const playerResponse = extractJsonAfter(
    html,
    "ytInitialPlayerResponse",
  ) as PlayerResponseShape | null;

  const tracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? null;
  if (!tracks || tracks.length === 0) return null;

  const track = pickTrack(tracks);
  if (!track?.baseUrl) return null;

  return fetchCaptionContent(track.baseUrl);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function truncate(segments: TranscriptSegment[]): TranscriptSegment[] {
  let total = 0;
  const result: TranscriptSegment[] = [];
  for (const segment of segments) {
    total += segment.text.length;
    result.push(segment);
    if (total >= MAX_TRANSCRIPT_CHARS) break;
  }
  return result;
}

export async function fetchTranscript(
  videoId: string,
): Promise<TranscriptResult> {
  if (!VIDEO_ID_RE.test(videoId)) {
    throw new TranscriptError("Invalid video ID", 400);
  }

  try {
    const segments = await fetchViaWatchPage(videoId);
    if (segments && segments.length > 0) {
      return {
        segments: truncate(segments),
        language: "en",
        source: "watch-page",
      };
    }
  } catch (error) {
    if (error instanceof TranscriptError) throw error;
    // Fall through to error
  }

  throw new TranscriptError(
    "No transcript available for this video. Captions may be disabled or the video may be private.",
    404,
  );
}
