import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = request.headers.authorization;
  const token = authHeader?.slice(7);

  if (!token) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const videoId = request.query.videoId as string;

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return response.status(400).json({ error: "Invalid video ID" });
  }

  try {
    const transcriptResponse = await fetch(
      `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`
    );

    if (!transcriptResponse.ok) {
      return response.status(502).json({ error: "Failed to fetch transcript" });
    }

    const data = await transcriptResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    console.error("Transcript fetch error:", error);
    return response.status(500).json({ error: "Failed to fetch transcript" });
  }
}
