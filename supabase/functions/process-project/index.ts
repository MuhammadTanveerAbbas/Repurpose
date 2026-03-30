import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let projectId: string | null = null;

  try {
    const body = await req.json();
    projectId = body.projectId ?? null;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing projectId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const AI_API_KEY = Deno.env.get("AI_API_KEY");

    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env vars not configured");
    if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projErr || !project) throw new Error("Project not found: " + (projErr?.message ?? "unknown"));

    let transcript: string | null = project.transcript ?? null;

    // Try to fetch YouTube transcript if not already stored
    if (project.source_type === "youtube" && !transcript && project.source_url) {
      try {
        const funcUrl = `${supabaseUrl}/functions/v1/fetch-transcript`;
        const resp = await fetch(funcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ youtubeUrl: project.source_url, projectId }),
        });
        const result = await resp.json();
        if (result.transcript) {
          transcript = result.transcript;
          await supabase
            .from("projects")
            .update({ transcript, title: result.title || project.title })
            .eq("id", projectId);
        } else {
          console.error("fetch-transcript returned no transcript:", result.error);
        }
      } catch (fetchErr) {
        console.error("fetch-transcript call failed:", fetchErr);
      }
    }

    // No transcript at all — mark error so UI shows manual paste option
    if (!transcript || transcript.trim().length < 10) {
      await supabase.from("projects").update({ status: "error" }).eq("id", projectId);
      return new Response(
        JSON.stringify({ error: "Could not extract transcript. Please paste it manually on the project page." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedOutputs: string[] = project.selected_outputs || [];
    if (selectedOutputs.length === 0) {
      await supabase.from("projects").update({ status: "error" }).eq("id", projectId);
      return new Response(
        JSON.stringify({ error: "No output formats selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;

    for (const formatType of selectedOutputs) {
      try {
        const funcUrl = `${supabaseUrl}/functions/v1/generate-content`;
        const resp = await fetch(funcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ projectId, formatType, transcript, tone: "professional" }),
        });
        const result = await resp.json();
        if (result.content) {
          successCount++;
        } else {
          console.error(`generate-content failed for ${formatType}:`, result.error);
        }
      } catch (genErr) {
        console.error(`generate-content threw for ${formatType}:`, genErr);
      }
    }

    if (successCount === 0) {
      await supabase.from("projects").update({ status: "error" }).eq("id", projectId);
      return new Response(
        JSON.stringify({ error: "Content generation failed for all formats. Check AI_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("projects")
      .update({ status: "completed", output_count: successCount })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, outputCount: successCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("process-project error:", e);
    if (projectId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.from("projects").update({ status: "error" }).eq("id", projectId);
      } catch { /* ignore */ }
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
