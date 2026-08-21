// YouTube transcript crawler with layered fallback strategies:
//   1. Watch-page scrape (extracts ytInitialPlayerResponse caption tracks)
//   2. InnerTube player API (mobile client, bypasses most consent walls)
//   3. Community transcript API (last resort)

const WATCH_URL = "https://www.youtube.com/watch";
const INNERTUBE_PLAYER_URL = "https://www.youtube.com/youtubei/v1/player";
const FALLBACK_API_URL = "https://yt-transcript-api.vercel.app/api/transcript";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_TRANSCRIPT_CHARS = 80_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  segments: TranscriptSegment[];
  language: string;
  source: "watch-page" | "innertube" | "fallback-api";
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
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decode HTML entities found inside YouTube caption payloads. */
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
  return decodeHtmlEntities(raw)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract a balanced JSON object that follows a JS assignment marker such as
 * "ytInitialPlayerResponse = ". Regex alone cannot safely bound the object.
 */
export function extractJsonAfter(html: string, marker: string): unknown | null {
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;
  const openBrace = html.indexOf("{", startIdx + marker.length);
  if (openBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openBrace; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(openBrace, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Caption payload parsers
// ---------------------------------------------------------------------------

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
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
  } catch {
    return null;
  }
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

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
}

interface PlayerResponseShape {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: { status?: string; reason?: string };
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  const english = tracks.find((t) => t.languageCode?.startsWith("en") && t.kind !== "asr");
  const englishAsr = tracks.find((t) => t.languageCode?.startsWith("en"));
  return english ?? englishAsr ?? tracks[0];
}

async function fetchSegmentsFromTrack(
  track: CaptionTrack,
): Promise<TranscriptSegment[] | null> {
  if (!track.baseUrl) return null;
  const base = track.baseUrl.replace(/^http:/, "https:");

  // json3 is compact and reliable; fall back to the default XML payload.
  for (const suffix of ["&fmt=json3", ""]) {
    try {
      const res = await fetchWithTimeout(`${base}${suffix}`, {
        headers: { "User-Agent": BROWSER_UA },
      });
      if (!res.ok) continue;
      const body = await res.text();
      const segments = suffix ? parseJson3(body) : parseTimedTextXml(body) ?? parseJson3(body);
      if (segments && segments.length > 0) return segments;
    } catch {
      // Try the next format.
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Strategy 1: watch-page scrape
// ---------------------------------------------------------------------------

async function fetchViaWatchPage(videoId: string): Promise<TranscriptSegment[] | null> {
  const res = await fetchWithTimeout(`${WATCH_URL}?v=${videoId}&hl=en&has_verified=1`, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "CONSENT=YES+cb; SOCS=CAI",
    },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const playerResponse = extractJsonAfter(html, "ytInitialPlayerResponse") as PlayerResponseShape | null;
  const tracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? null;
  if (!tracks) return null;

  const track = pickTrack(tracks);
  if (!track) return null;
  return fetchSegmentsFromTrack(track);
}

// ---------------------------------------------------------------------------
// Strategy 2: InnerTube player API
// ---------------------------------------------------------------------------

const INNERTUBE_CLIENTS = [
  {
    clientName: "ANDROID",
    clientVersion: "19.09.37",
    userAgent: "com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip",
  },
  {
    clientName: "WEB",
    clientVersion: "2.20240401.00.00",
    userAgent: BROWSER_UA,
  },
];

async function fetchViaInnerTube(videoId: string): Promise<TranscriptSegment[] | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const res = await fetchWithTimeout(INNERTUBE_PLAYER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": client.userAgent,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: client.clientName,
              clientVersion: client.clientVersion,
              hl: "en",
              gl: "US",
            },
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });
      if (!res.ok) continue;

      const data = (await res.json().catch(() => null)) as PlayerResponseShape | null;
      const playability = data?.playabilityStatus?.status;
      if (playability && playability !== "OK") continue;

      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!Array.isArray(tracks)) continue;

      const track = pickTrack(tracks);
      const segments = track ? await fetchSegmentsFromTrack(track) : null;
      if (segments) return segments;
    } catch {
      // Try the next client.
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Strategy 3: community fallback API
// ---------------------------------------------------------------------------

async function fetchViaFallbackApi(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    const res = await fetchWithTimeout(`${FALLBACK_API_URL}?videoId=${videoId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return null;
    const segments = data
      .map((item) => {
        const entry = item as { text?: string; offset?: number; start?: number; duration?: number };
        const text = cleanCaptionText(entry.text ?? "");
        return {
          text,
          start: entry.offset ?? entry.start ?? 0,
          duration: entry.duration ?? 0,
        };
      })
      .filter((s) => s.text.length > 0);
    return segments.length > 0 ? segments : null;
  } catch {
    return null;
  }
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

/**
 * Crawl the transcript for a YouTube video using layered strategies.
 * Throws TranscriptError when every strategy fails or the video is unusable.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  if (!VIDEO_ID_RE.test(videoId)) {
    throw new TranscriptError("Invalid video ID", 400);
  }

  const strategies: Array<{
    name: TranscriptResult["source"];
    run: () => Promise<TranscriptSegment[] | null>;
  }> = [
    { name: "watch-page", run: () => fetchViaWatchPage(videoId) },
    { name: "innertube", run: () => fetchViaInnerTube(videoId) },
    { name: "fallback-api", run: () => fetchViaFallbackApi(videoId) },
  ];

  for (const strategy of strategies) {
    try {
      const segments = await strategy.run();
      if (segments && segments.length > 0) {
        return { segments: truncate(segments), language: "en", source: strategy.name };
      }
    } catch (error) {
      if (error instanceof TranscriptError) throw error;
      // Network hiccups between strategies: brief pause, then keep going.
      await sleep(300);
    }
  }

  throw new TranscriptError(
    "No transcript available for this video. It may have captions disabled.",
    404,
  );
}
