import { verifyUser } from "./_lib/verify-auth";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY environment variable");
}

const groqRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
});

const TIMEOUT_MS = 55000;
const MAX_RETRIES = 2;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok || attempt === retries) return response;
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error("All retries exhausted");
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!GROQ_API_KEY) {
    return response.status(500).json({ error: "Server configuration error" });
  }

  const user = await verifyUser(request.headers.authorization);
  if (!user) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const parsed = groqRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid request body" });
  }

  try {
    const groqResponse = await fetchWithRetry(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(parsed.data),
      },
      MAX_RETRIES,
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errorText);
      return response.status(groqResponse.status).json({
        error: "AI service temporarily unavailable",
      });
    }

    const data = await groqResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    console.error("Groq proxy error:", error);
    return response.status(500).json({
      error: "AI service temporarily unavailable",
    });
  }
}
