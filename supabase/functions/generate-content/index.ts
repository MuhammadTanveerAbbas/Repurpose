import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const formatPrompts: Record<string, string> = {
  linkedin_long: "Write a LinkedIn long-form post (1200-1500 words). Use a compelling hook in the first line, share personal insights, include specific examples, and end with a clear CTA. Use short paragraphs. Don't use hashtags in the body, add 3-5 relevant hashtags at the very end.",
  linkedin_hook: "Write a punchy LinkedIn hook post (under 700 characters). Open with a bold, scroll-stopping first line. Use the pattern interrupt format to make the reader stop scrolling. Keep it to 3-5 short lines max. Add 3 hashtags at the end.",
  twitter_thread: "Write a Twitter/X thread of exactly 7 tweets. Each tweet MUST be under 280 characters. Number them 1/7 through 7/7. The first tweet should hook the reader. The last tweet should include a call to action. Separate each tweet with ---.",
  email_newsletter: "Write an email newsletter section. Include a brief subject line suggestion at the top. Write in a scannable format with a compelling intro paragraph, 3-4 key takeaways as bullet points, and a closing paragraph with a link placeholder. Keep it under 400 words.",
  youtube_description: "Write a YouTube video description. Include: a 2-3 sentence summary, timestamps section (create logical timestamps based on the content), key takeaways section, relevant links section (use placeholders), and end with 15-20 relevant tags separated by commas.",
  short_form_scripts: "Write 3 short-form video scripts (TikTok/Reels/Shorts style), each exactly 60 seconds when read aloud. Each script should: open with a strong hook in the first 3 seconds, deliver one key insight, and end with a call to action. Label them Script 1, Script 2, Script 3. Separate with ===.",
};

const toneInstructions: Record<string, string> = {
  professional: "Use a professional, authoritative tone. Be clear and credible.",
  casual: "Use a conversational, friendly tone. Write like you're talking to a colleague over coffee.",
  punchy: "Use a bold, high-energy tone. Short sentences. Strong opinions. No filler words.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, formatType, transcript, tone } = await req.json();

    if (!transcript || !formatType) {
      return new Response(JSON.stringify({ error: "Missing transcript or formatType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

    const formatPrompt = formatPrompts[formatType] || "Write a summary of the following content.";
    const tonePrompt = toneInstructions[tone || "professional"];

    const systemPrompt = "You are an expert content repurposing assistant. You take video/podcast transcripts and transform them into platform-specific content. " + tonePrompt + ". Output ONLY the content itself with no meta-commentary, no explanations. Just the raw content ready to copy-paste.";
    const userPrompt = formatPrompt + "\n\nHere is the transcript to repurpose:\n\n" + transcript.slice(0, 15000);

    // Groq API (OpenAI-compatible)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please check your Groq account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      throw new Error("Groq API returned " + response.status);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (projectId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("project_outputs").upsert(
        {
          project_id: projectId,
          format_type: formatType,
          content,
          tone: tone || "professional",
        },
        { onConflict: "project_id,format_type" }
      );
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
