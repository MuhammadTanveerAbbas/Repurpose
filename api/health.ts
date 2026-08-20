import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const HEALTH_TIMEOUT_MS = 10_000;

// A lightweight read-only check against an existing resource. The timeout
// ensures the endpoint fails clearly instead of hanging when Supabase is
// genuinely unavailable.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) }),
  },
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { error } = await supabase.from("projects").select("id").limit(1);

    if (error) {
      return response.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      });
    }

    return response.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      version: "1.0.0",
    });
  } catch {
    return response.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Internal error",
    });
  }
}
