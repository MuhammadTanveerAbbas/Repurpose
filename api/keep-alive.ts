import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const { error } = await supabase.from("projects").select("id").limit(1);

  if (error) {
    console.error("Keep-alive query failed:", error);
    return response.status(500).json({ error: "Database connection failed" });
  }

  return response.status(200).json({ success: true, message: "Database connection alive" });
}