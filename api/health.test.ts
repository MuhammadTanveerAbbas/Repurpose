// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@supabase/supabase-js";

type ResponseLike = {
  statusCode: number;
  body: unknown;
  status: (code: number) => ResponseLike;
  json: (body: unknown) => ResponseLike;
};

const makeResponse = (): ResponseLike => {
  const res = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
};

const makeRequest = (method = "GET") => ({ method, query: {}, headers: {} });

const makeSupabaseClient = (
  limitResult: () => Promise<{ error: unknown }>,
) => ({
  from: () => ({
    select: () => ({
      limit: limitResult,
    }),
  }),
});

let handler: (req: unknown, res: ResponseLike) => Promise<void>;
let limitResult: () => Promise<{ error: unknown }>;

beforeEach(async () => {
  vi.resetModules();
  vi.unstubAllGlobals();
  process.env.VITE_SUPABASE_URL = "https://fake.supabase.co";
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "fake-anon-key";

  limitResult = async () => ({ error: null });
  vi.mocked(createClient).mockReturnValue(
    makeSupabaseClient(() => limitResult()) as never,
  );

  const health = await import("./health");
  handler = health.default;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("health endpoint", () => {
  it("returns ok when the read-only check succeeds", async () => {
    const res = makeResponse();
    await handler(makeRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "connected" });
  });

  it("reports unhealthy when the database query fails", async () => {
    limitResult = async () => ({ error: { message: "connection refused" } });

    const res = makeResponse();
    await handler(makeRequest(), res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ status: "unhealthy", database: "disconnected" });
  });

  it("returns an internal error when the query throws", async () => {
    limitResult = async () => {
      throw new Error("boom");
    };

    const res = makeResponse();
    await handler(makeRequest(), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ status: "unhealthy", error: "Internal error" });
  });

  it("rejects non-GET methods", async () => {
    const res = makeResponse();
    await handler(makeRequest("POST"), res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toMatchObject({ error: "Method not allowed" });
  });

  it("performs a read-only request and never writes data", async () => {
    // If the handler ever attempted a write, the mock (which only exposes
    // from().select().limit()) would throw and the response would not be 200.
    const res = makeResponse();
    await handler(makeRequest(), res);

    expect(res.statusCode).toBe(200);
  });

  it("does not expose secrets in responses", async () => {
    limitResult = async () => ({ error: { message: "connection refused" } });

    const res = makeResponse();
    await handler(makeRequest(), res);

    expect(JSON.stringify(res.body)).not.toContain("fake-anon-key");
    expect(JSON.stringify(res.body)).not.toContain("fake.supabase.co");
  });
});
