import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchTranscript(videoId: string): Promise<{ transcript: string; title: string }> {
  const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Cookie": "CONSENT=PENDING+999",
    },
  });
  const html = await pageResp.text();

  const titleMatch = html.match(/"title":"((?:[^"\\]|\\.)*)"/);
  let title = titleMatch ? JSON.parse(`"${titleMatch[1]}"`) : "Untitled Video";

  const captionUrlPattern = /"baseUrl":"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/g;
  const captionUrls: { url: string; lang: string }[] = [];
  let m;
  while ((m = captionUrlPattern.exec(html)) !== null) {
    let url = m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
    const langMatch = url.match(/lang=([a-z]{2}(?:-[A-Z]{2})?)/);
    const lang = langMatch ? langMatch[1] : "";
    captionUrls.push({ url, lang });
  }

  if (captionUrls.length === 0) {
    throw new Error("No captions available for this video. The video may not have subtitles enabled.");
  }

  const englishCaption = captionUrls.find(c => c.lang.startsWith("en")) || captionUrls[0];
  let captionUrl = englishCaption.url;

  // Try multiple caption formats  YouTube serves XML or JSON3 depending on the request
  const formats = ["", "&fmt=srv1", "&fmt=srv3", "&fmt=json3"];

  for (const fmt of formats) {
    const url = captionUrl + fmt;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const body = await resp.text();

    if (body.length === 0) continue;

    if (body.includes("<text")) {
      const transcript = parseXmlCaptions(body);
      if (transcript) return { transcript, title };
    }

    if (body.startsWith("{")) {
      try {
        const json = JSON.parse(body);
        const events = json?.events || [];
        const segments: string[] = [];
        for (const event of events) {
          const segs = event?.segs || [];
          for (const seg of segs) {
            const text = (seg.utf8 || "").replace(/\n/g, " ").trim();
            if (text) segments.push(text);
          }
        }
        if (segments.length > 0) {
          return { transcript: segments.join(" "), title };
        }
      } catch {
        // malformed JSON  try next format
      }
    }
  }

  throw new Error("Failed to extract captions. The video may have restricted access to its subtitles.");
}

function parseXmlCaptions(xml: string): string | null {
  const textSegments: string[] = [];
  const regex = /<text[^>]*>(.*?)<\/text>/gs;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    let text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\\n/g, " ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (text) textSegments.push(text);
  }
  return textSegments.length > 0 ? textSegments.join(" ") : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { youtubeUrl, projectId } = await req.json();

    if (!youtubeUrl) {
      return new Response(JSON.stringify({ error: "Missing youtubeUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transcript, title } = await fetchTranscript(videoId);

    if (projectId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("projects").update({ transcript, title }).eq("id", projectId);
    }

    return new Response(JSON.stringify({ transcript, title, videoId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed to fetch transcript" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
