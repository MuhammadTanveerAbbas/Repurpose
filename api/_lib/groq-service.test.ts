// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const MODELS_URL = "https://api.groq.com/openai/v1/models";
const MODEL = "llama-3.3-70b-versatile";
const FALLBACK = "llama-3.1-8b-instant";

type ServiceModule = typeof import("./groq-service");

let mod: ServiceModule;

const modelList = (ids: string[]) =>
  JSON.stringify({
    object: "list",
    data: ids.map((id) => ({ id, object: "model", active: true, context_window: 8192 })),
  });

const chatCompletion = (content: string, model = MODEL) =>
  JSON.stringify({
    id: "chatcmpl-test",
    object: "chat.completion",
    model,
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
  });

const errorBody = (code: string, message: string) =>
  JSON.stringify({ error: { code, message, type: "invalid_request_error" } });

const modelsResponse = (ids: string[]) => new Response(modelList(ids), { status: 200 });
const chatOkResponse = (content = "hello world", model = MODEL) =>
  new Response(chatCompletion(content, model), { status: 200 });
const chatResponse = (status: number, body: string, headers?: Record<string, string>) =>
  new Response(body, { status, headers });

const queueFetch = (items: Array<Response | (() => Response)>) => {
  const fn = vi.fn(() => {
    const item = items.shift();
    if (!item) throw new Error("No more mocked fetch responses");
    return typeof item === "function" ? item() : item;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
};

beforeEach(async () => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  process.env.GROQ_API_KEY = "test-secret-key";
  vi.resetModules();
  mod = await import("./groq-service");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("groq-service", () => {
  it("completes a normal chat request using the requested model", async () => {
    const fetchMock = queueFetch([modelsResponse([MODEL, FALLBACK]), chatOkResponse("Hello!")]);

    const result = await mod.completeChat({
      model: MODEL,
      messages: [{ role: "user", content: "hi" }],
      temperature: 0.75,
      max_tokens: 2000,
    });

    expect(result.model).toBe(MODEL);
    expect(result.data.choices?.[0].message.content).toBe("Hello!");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.model).toBe(MODEL);
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    expect(body.temperature).toBe(0.75);
  });

  it("selects a preferred model when the client does not pin one", async () => {
    const fetchMock = queueFetch([modelsResponse([FALLBACK, MODEL]), chatOkResponse("ok", MODEL)]);

    const result = await mod.completeChat({ messages: [{ role: "user", content: "hi" }] });

    expect(result.model).toBe(MODEL);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.model).toBe(MODEL);
  });

  it("falls back to a preferred model when the requested model is unavailable", async () => {
    const fetchMock = queueFetch([modelsResponse([FALLBACK]), chatOkResponse("ok", FALLBACK)]);

    const result = await mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });

    expect(result.model).toBe(FALLBACK);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.model).toBe(FALLBACK);
  });

  it("caches the model list within the TTL", async () => {
    const fetchMock = queueFetch([modelsResponse([MODEL])]);

    const first = await mod.getAvailableModels();
    const second = await mod.getAvailableModels();

    expect(first).toEqual([MODEL]);
    expect(second).toEqual([MODEL]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(MODELS_URL);
  });

  it("refreshes the model list after the TTL expires", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([modelsResponse([MODEL]), modelsResponse([MODEL, FALLBACK])]);

    await mod.getAvailableModels();
    vi.advanceTimersByTime(60_001);
    const refreshed = await mod.getAvailableModels();

    expect(refreshed).toEqual([MODEL, FALLBACK]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refreshes the model list and falls back when the selected model is rejected", async () => {
    const fetchMock = queueFetch([
      modelsResponse([MODEL, FALLBACK]),
      chatResponse(400, errorBody("model_not_found", `The model '${MODEL}' does not exist`)),
      modelsResponse([MODEL, FALLBACK]),
      chatOkResponse("fallback output", FALLBACK),
    ]);

    const result = await mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });

    expect(result.model).toBe(FALLBACK);
    expect(result.data.choices?.[0].message.content).toBe("fallback output");
    expect(fetchMock).toHaveBeenCalledTimes(4);

    const retryBody = JSON.parse(fetchMock.mock.calls[3][1].body);
    expect(retryBody.model).toBe(FALLBACK);
  });

  it("fails gracefully when no fallback model is available", async () => {
    const fetchMock = queueFetch([
      modelsResponse([MODEL]),
      chatResponse(400, errorBody("model_not_found", "does not exist")),
      modelsResponse([]),
    ]);

    await expect(
      mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toMatchObject({ name: "GroqServiceError", status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("respects Retry-After and recovers from a rate limit", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([
      modelsResponse([MODEL]),
      chatResponse(429, errorBody("rate_limit_exceeded", "slow down"), { "Retry-After": "1" }),
      chatOkResponse("recovered"),
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    await vi.advanceTimersByTimeAsync(2_000);
    const result = await promise;

    expect(result.data.choices?.[0].message.content).toBe("recovered");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops retrying after the rate-limit cap", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([
      modelsResponse([MODEL]),
      chatResponse(429, errorBody("rate_limit_exceeded", "slow down"), { "Retry-After": "1" }),
      chatResponse(429, errorBody("rate_limit_exceeded", "slow down"), { "Retry-After": "1" }),
      chatResponse(429, errorBody("rate_limit_exceeded", "slow down"), { "Retry-After": "1" }),
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    const assertion = expect(promise).rejects.toMatchObject({
      name: "GroqServiceError",
      status: 429,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("recovers from transient 5xx errors with bounded backoff", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([modelsResponse([MODEL]), chatResponse(500, "server error"), chatOkResponse("ok after retry")]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await promise;

    expect(result.data.choices?.[0].message.content).toBe("ok after retry");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("fails after exhausting transient retries", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([
      modelsResponse([MODEL]),
      chatResponse(503, "unavailable"),
      chatResponse(503, "unavailable"),
      chatResponse(503, "unavailable"),
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    const assertion = expect(promise).rejects.toMatchObject({
      name: "GroqServiceError",
      status: 503,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("recovers from transient network failures", async () => {
    vi.useFakeTimers();
    queueFetch([
      modelsResponse([MODEL]),
      () => {
        throw new TypeError("fetch failed");
      },
      chatOkResponse("network recovered"),
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await promise;

    expect(result.data.choices?.[0].message.content).toBe("network recovered");
  });

  it("retries on timeout", async () => {
    vi.useFakeTimers();
    queueFetch([
      modelsResponse([MODEL]),
      () => {
        throw new Error("TimeoutError");
      },
      chatOkResponse("recovered from timeout"),
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await promise;

    expect(result.data.choices?.[0].message.content).toBe("recovered from timeout");
  });

  it("treats a malformed 200 response as a transient failure", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([
      modelsResponse([MODEL]),
      new Response("not json", { status: 200 }),
      new Response("not json", { status: 200 }),
      new Response("not json", { status: 200 }),
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    const assertion = expect(promise).rejects.toMatchObject({
      name: "GroqServiceError",
      status: 502,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("fails gracefully when the model list cannot be fetched", async () => {
    const fetchMock = queueFetch([
      () => {
        throw new TypeError("fetch failed");
      },
    ]);

    await expect(
      mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toMatchObject({ name: "GroqServiceError", status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not leak secrets in final failures", async () => {
    vi.useFakeTimers();
    const fetchMock = queueFetch([
      modelsResponse([MODEL]),
      () => {
        throw new TypeError("fetch failed");
      },
      () => {
        throw new TypeError("fetch failed");
      },
      () => {
        throw new TypeError("fetch failed");
      },
    ]);

    const promise = mod.completeChat({ model: MODEL, messages: [{ role: "user", content: "hi" }] });
    const errorPromise = promise.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    const error = await errorPromise;

    expect((error as Error).name).toBe("GroqServiceError");
    expect((error as Error).message).not.toContain("test-secret-key");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
