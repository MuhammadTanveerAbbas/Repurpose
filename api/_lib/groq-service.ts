const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const CHAT_COMPLETIONS_URL = `${GROQ_BASE_URL}/chat/completions`;
const MODELS_URL = `${GROQ_BASE_URL}/models`;

const REQUEST_TIMEOUT_MS = 55_000;
const MODEL_CACHE_TTL_MS = 60_000;
const MAX_MODEL_FALLBACKS = 1;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_TRANSIENT_RETRIES = 2;
const MAX_RETRY_AFTER_MS = 10_000;
const MAX_BACKOFF_MS = 8_000;

// Preserves the application's existing model preference while providing
// deterministic fallbacks selected from the live model list.
const PREFERRED_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-specdec",
  "llama-3.2-3b-preview",
];

const NON_CHAT_PREFIXES = [
  "whisper-",
  "distil-whisper-",
  "wav2vec2-",
  "playai-",
  "soundflower-",
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
  !NON_CHAT_PREFIXES.some((prefix) => id.startsWith(prefix));

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

// Fetches the current Groq model list and caches it server-side.
// Pass force=true to bypass the cache (used when the selected model is rejected).
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
    throw new GroqServiceError("AI service temporarily unavailable", 503);
  }

  if (!response.ok) {
    throw new GroqServiceError("AI service temporarily unavailable", response.status);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as { data?: unknown }).data)) {
    throw new GroqServiceError("AI service returned an invalid model list", 502);
  }

  const models = ((body as { data: Array<{ id?: string; active?: boolean }> }).data)
    .filter(
      (model) =>
        model.active !== false && !!model.id && isChatModel(model.id as string),
    )
    .map((model) => model.id as string);

  modelsCache = { fetchedAt: Date.now(), models };
  return models;
}

// Deterministic model selection: the requested model first (preserving the
// application's existing preference), then a known-good preferred order, then
// any remaining chat-capable model.
async function selectModel(requested?: string, exclude: Set<string>): Promise<string> {
  const available = await getAvailableModels();
  const candidates = available.filter((model) => !exclude.has(model));

  if (requested && !exclude.has(requested) && available.includes(requested)) {
    return requested;
  }

  for (const preferred of PREFERRED_MODELS) {
    if (candidates.includes(preferred)) return preferred;
  }

  const fallback = candidates[0];
  if (fallback) return fallback;

  throw new GroqServiceError("No suitable AI model available", 503);
}

// Runs a chat completion with bounded, safe retries. Never retries forever.
export async function completeChat(params: GroqChatParams): Promise<GroqChatResult> {
  if (!GROQ_API_KEY) {
    throw new GroqServiceError("AI service is not configured", 500);
  }

  const failedModels = new Set<string>();
  let model = params.model;
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
      // Network error or timeout - transient, safe to retry.
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

    // The selected model was rejected - refresh the list and fall back once.
    if (
      (status === 400 || status === 404) &&
      isModelError(await response.json().catch(() => null))
    ) {
      failedModels.add(model);
      if (modelFallbacks >= MAX_MODEL_FALLBACKS) {
        throw new GroqServiceError("AI service temporarily unavailable", status);
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

    // Rate limit - respect Retry-After, otherwise bounded backoff with jitter.
    if (status === 429) {
      if (rateLimitRetries >= MAX_RATE_LIMIT_RETRIES) {
        throw new GroqServiceError(
          "AI service is temporarily rate-limited. Try again shortly.",
          429,
        );
      }
      const retryAfterMs = parseRetryAfterMs(response.headers.get("Retry-After"));
      rateLimitRetries += 1;
      await sleep(retryAfterMs ?? backoffDelay(rateLimitRetries));
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

    // Any other client error - do not retry.
    throw new GroqServiceError("AI service request failed", status);
  }
}
