import { verifyUser } from "./_lib/verify-auth";
import { completeChat, GroqServiceError } from "./_lib/groq-service";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY environment variable");
}

const groqRequestSchema = z.object({
  model: z.string().min(1).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
});

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
    const { data } = await completeChat(parsed.data);
    return response.status(200).json(data);
  } catch (error) {
    const status = error instanceof GroqServiceError ? error.status : 500;
    console.error(
      "Groq proxy error:",
      error instanceof Error ? error.message : error,
    );
    return response.status(status).json({
      error: "AI service temporarily unavailable",
    });
  }
}
