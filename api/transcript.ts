import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyUser } from "./_lib/verify-auth";
import { extractVideoId, fetchTranscript, TranscriptError } from "./_lib/youtube-transcript";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const user = await verifyUser(request.headers.authorization);
  if (!user) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const rawInput = (request.query.videoId as string | undefined)?.trim() ?? "";
  const videoId = extractVideoId(rawInput);

  if (!videoId) {
    return response.status(400).json({
      error: "Invalid YouTube URL or video ID",
    });
  }

  try {
    const { segments } = await fetchTranscript(videoId);
    return response
      .status(200)
      .setHeader("Cache-Control", "public, max-age=3600")
      .json(segments);
  } catch (error) {
    if (error instanceof TranscriptError) {
      return response.status(error.status).json({ error: error.message });
    }
    console.error("Transcript fetch error:", error);
    return response.status(502).json({
      error: "Failed to fetch transcript. Paste it manually instead.",
    });
  }
}
