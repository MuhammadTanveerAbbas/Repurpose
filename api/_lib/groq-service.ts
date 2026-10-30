const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const CHAT_COMPLETIONS_URL = `${GROQ_BASE_URL}/chat/completions`;
const MODELS_URL = `${GROQ_BASE_URL}/models`;

const REQUEST_TIMEOUT_MS = 55_000;
const MODEL_CACHE_TTL_MS = 120_000; // 2 min refresh more often
const MAX_MODEL_FALLBACKS = 5; // try up to 5 models before giving up
const MAX_RATE_LIMIT_RETRIES = 5; // removed the hard cap retry until back-off exhausted
const MAX_TRANSIENT_RETRIES = 3;
const MAX_RETRY_AFTER_MS = 30_000; // respect up to 30 s Retry-After
const MAX_BACKOFF_MS = 20_000;

// Ordered by quality/speed preference auto-picked from the live model list.
// The service always fetches the live list first; this is just a priority order.
// Updated Oct 2025: Groq rotated to GPT-OSS, Qwen3, Allam models.
const PREFERRED_MODELS = [
  "openai/gpt-oss-120b",               // best quality, reasoning model
  "qwen/qwen3.8-27b",                   // strong reasoning, fast
  "openai/gpt-oss-20b",                 // good quality, smaller
  "allam-2-7b",                          // fast fallback
  // Legacy fallbacks (in case Groq re-enables these)
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mistral-saba-24b",
];

const NON_CHAT_PREFIXES = [
  "whisper-",
  "distil-whisper-",
  "wav2vec2-",
  "playai-",
  "soundflower-",
  "canopylabs/orpheus-",   // TTS models
];

// Regex patterns for non-chat models (guard, safeguard, moderation)
const NON_CHAT_PATTERNS = [
  /prompt-guard/i,
  /safeguard/i,
  /moderation/i,
];

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatParams {
  model?: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface GroqChatResult {
  model: string;
  data: Record<string, unknown>;
}

export class GroqServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqServiceError";
    this.status = status;
  }
}

interface ModelsCache {
  fetchedAt: number;
  models: string[];
}

let modelsCache: ModelsCache | null = null;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isChatModel = (id: string): boolean =>
  !NON_CHAT_PREFIXES.some((prefix) => id.startsWith(prefix)) &&
  !NON_CHAT_PATTERNS.some((pattern) => pattern.test(id));

// Exponential backoff with jitter, bounded to avoid hammering the API.
const backoffDelay = (attempt: number, baseMs = 500): number => {
  const exponential = Math.min(MAX_BACKOFF_MS, baseMs * 2 ** attempt);
  const jitter = Math.random() * exponential * 0.25;
  return Math.floor(exponential + jitter);
};

const parseRetryAfterMs = (header: string | null): number | null => {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
};

const isModelError = (body: unknown): boolean => {
  if (!body || typeof body !== "object") return false;
  const error = (body as { error?: { code?: string; message?: string } }).error;
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  return (
    code === "model_not_found" ||
    code === "invalid_model" ||
    /model.*(not found|does not exist|not exist|not available)/i.test(message) ||
    /does not (exist|support)/i.test(message)
  );
};

const parseChatCompletion = async (
  response: Response,
): Promise<Record<string, unknown> | null> => {
  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    const choices = (data as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
    const content = choices?.[0]?.message?.content;
    if (!Array.isArray(choices) || typeof content !== "string") return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
};

/**
 * Fetches the current Groq model list and caches it server-side.
 * Pass force=true to bypass the cache (used when the selected model is rejected).
 */
export async function getAvailableModels(force = false): Promise<string[]> {
  if (
    !force &&
    modelsCache &&
    Date.now() - modelsCache.fetchedAt < MODEL_CACHE_TTL_MS
  ) {
    return modelsCache.models;
  }

  let response: Response;
  try {
    response = await fetch(MODELS_URL, {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // If the models endpoint is down, return the preferred list as a fallback
    // so the service can still attempt completions.
    if (modelsCache) return modelsCache.models;
    return [...PREFERRED_MODELS];
  }

  if (!response.ok) {
    if (modelsCache) return modelsCache.models;
    return [...PREFERRED_MODELS];
  }

  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as { data?: unknown }).data)) {
    if (modelsCache) return modelsCache.models;
    return [...PREFERRED_MODELS];
  }

  const models = ((body as { data: Array<{ id?: string; active?: boolean }> }).data)
    .filter(
      (model) =>
        model.active !== false && !!model.id && isChatModel(model.id as string),
    )
    .map((model) => model.id as string);

  if (models.length > 0) {
    modelsCache = { fetchedAt: Date.now(), models };
  }
  return models.length > 0 ? models : [...PREFERRED_MODELS];
}

/**
 * Deterministic model selection: the requested model first (preserving the
 * application's existing preference), then a known-good preferred order, then
 * any remaining chat-capable model from the live list.
 */
async function selectModel(requested?: string, exclude: Set<string> = new Set()): Promise<string> {
  const available = await getAvailableModels();
  const candidates = available.filter((model) => !exclude.has(model));

  // Honor an explicit model request if it's available and not excluded.
  if (requested && !exclude.has(requested) && available.includes(requested)) {
    return requested;
  }

  // Walk down preferred list in order.
  for (const preferred of PREFERRED_MODELS) {
    if (candidates.includes(preferred)) return preferred;
  }

  // Any remaining model from the live list.
  const fallback = candidates[0];
  if (fallback) return fallback;

  throw new GroqServiceError("No suitable AI model available", 503);
}

/**
 * Runs a chat completion with bounded, safe retries and unlimited model
 * fallbacks across the live model list. Never retries forever.
 */
export async function completeChat(params: GroqChatParams): Promise<GroqChatResult> {
  if (!GROQ_API_KEY) {
    throw new GroqServiceError("AI service is not configured", 500);
  }

  const failedModels = new Set<string>();
  let model: string;

  try {
    model = await selectModel(params.model, failedModels);
  } catch (error) {
    if (error instanceof GroqServiceError) throw error;
    throw new GroqServiceError("AI service temporarily unavailable", 503);
  }

  let rateLimitRetries = 0;
  let transientRetries = 0;
  let modelFallbacks = 0;

  while (true) {
    let response: Response;
    try {
      response = await fetch(CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      // Network error or timeout transient, safe to retry.
      if (transientRetries >= MAX_TRANSIENT_RETRIES) {
        throw new GroqServiceError("AI service temporarily unavailable", 502);
      }
      transientRetries += 1;
      await sleep(backoffDelay(transientRetries));
      continue;
    }

    if (response.ok) {
      const data = await parseChatCompletion(response);
      if (data) return { model, data };
      if (transientRetries >= MAX_TRANSIENT_RETRIES) {
        throw new GroqServiceError("AI service returned an invalid response", 502);
      }
      transientRetries += 1;
      await sleep(backoffDelay(transientRetries));
      continue;
    }

    const status = response.status;

    // The selected model was rejected refresh the model list and fall back.
    if (status === 400 || status === 404) {
      const body = await response.json().catch(() => null);
      if (isModelError(body)) {
        failedModels.add(model);
        if (modelFallbacks >= MAX_MODEL_FALLBACKS) {
          throw new GroqServiceError(
            "All available AI models are currently unavailable. Try again shortly.",
            503,
          );
        }
        try {
          await getAvailableModels(true);
          model = await selectModel(undefined, failedModels);
        } catch (error) {
          if (error instanceof GroqServiceError) throw error;
          throw new GroqServiceError("AI service temporarily unavailable", 503);
        }
        modelFallbacks += 1;
        continue;
      }
    }

    // Rate limit respect Retry-After, otherwise bounded exponential backoff.
    if (status === 429) {
      if (rateLimitRetries >= MAX_RATE_LIMIT_RETRIES) {
        // After exhausting retries on this model, try the next model instead
        // of failing hard different models have independent rate limit quotas.
        failedModels.add(model);
        if (modelFallbacks < MAX_MODEL_FALLBACKS) {
          try {
            await getAvailableModels(true);
            model = await selectModel(undefined, failedModels);
            modelFallbacks += 1;
            rateLimitRetries = 0; // reset for the new model
            continue;
          } catch {
            // no more models fall through to error
          }
        }
        throw new GroqServiceError(
          "AI service is temporarily rate-limited. Please try again in a moment.",
          429,
        );
      }
      const retryAfterMs = parseRetryAfterMs(response.headers.get("Retry-After"));
      rateLimitRetries += 1;
      await sleep(retryAfterMs ?? backoffDelay(rateLimitRetries, 1000));
      continue;
    }

    // Transient server-side failures.
    if (status >= 500) {
      if (transientRetries >= MAX_TRANSIENT_RETRIES) {
        throw new GroqServiceError("AI service temporarily unavailable", status);
      }
      transientRetries += 1;
      await sleep(backoffDelay(transientRetries));
      continue;
    }

    // Any other client error do not retry.
    throw new GroqServiceError("AI service request failed", status);
  }
}
