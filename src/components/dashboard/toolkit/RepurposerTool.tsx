import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ALL_FORMATS, FORMAT_ICONS, FORMAT_CHAR_LIMITS, callGroq, checkAndIncrementUsage } from "@/lib/groq";
import type { ContentFormat } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { Copy, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { sanitizeOutput } from "@/lib/sanitize";
import { toast } from "sonner";

const FORMAT_SPECIFIC_RULES: Record<string, string> = {
  "LinkedIn Post": "Short paragraphs (1-2 sentences). Hook in first 3 lines. Discussion CTA at end. 150-300 words. 3-5 hashtags at bottom only.",
  "LinkedIn Hook": "Exactly 3 lines that create a curiosity gap. No emoji. No hashtags. Under 300 chars total.",
  "Twitter/X Thread": "6-8 tweets. Tweet 1 is the hook. Number each. Each under 280 chars. Last tweet is CTA. No hashtags.",
  "Short-form Video Script": "Hook (0-3s) → Problem (3-10s) → Value (10-40s) → Payoff (40-55s) → CTA (55-60s). Include [VISUAL] cues and [PAUSE] for timing.",
  "Cold Email Draft": "Subject line (under 8 words) + 4-sentence body: opener, value, ask, social proof. Under 125 words total. Plain text.",
  "Newsletter Section": "Lead (1-2 sentences) → 3 bold-labeled key points → CTA. Write like a smart friend, not a brand.",
  "YouTube Description": "First 2 lines hook above fold. Summary (3-5 sentences). Timestamps (4-6 sections). CTA block. SEO hashtags. Links.",
  "Instagram Caption": "Hook line (no emoji). 3-5 short paragraphs. End with question CTA. 5-8 hashtags at end. Max 1-2 emojis in body.",
  "Personal Brand Bio Update": "3 sentences: position + unique value | proof + credibility | current focus + CTA. Under 100 words. No buzzwords.",
};

export const RepurposerTool = () => {
  const [sourceFormat, setSourceFormat] = useState<ContentFormat>("LinkedIn Post");
  const [targetFormat, setTargetFormat] = useState<ContentFormat>("Twitter/X Thread");
  const [sourceContent, setSourceContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preserveVoice, setPreserveVoice] = useState(true);

  const handleRepurpose = async () => {
    if (!sourceContent.trim()) {
      toast.error("Paste your source content first.");
      return;
    }
    if (sourceFormat === targetFormat) {
      toast.error("Pick a different target format.");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      await checkAndIncrementUsage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Usage limit reached");
      setLoading(false);
      return;
    }

    const targetRules = FORMAT_SPECIFIC_RULES[targetFormat] ?? "";
    const voiceInstruction = preserveVoice
      ? "CRITICAL: Preserve the author's original voice, tone, and perspective. It should feel like the same person wrote it."
      : "";

    try {
      const system = `You are a senior content repurposing strategist. Your specialty is taking existing content and reimagining it for a different platform without losing the core message or the author's voice.

SOURCE FORMAT: ${sourceFormat}
TARGET FORMAT: ${targetFormat}

TARGET FORMAT RULES:
${targetRules}

REPURPOSING RULES:
1. Extract the CORE MESSAGE from the source - what's the one thing the reader must take away?
2. Identify the BEST angle from the source that fits the target format
3. Rewrite completely for the new format - do NOT just reformat the source
4. Adapt the structure, pacing, and length to the target format's conventions
5. ${voiceInstruction}
6. Do NOT add placeholder text like [your name], [company], or [link]
7. Do NOT use transition phrases like "As mentioned in the original" or "In this version"
8. The output should read as a NATIVE piece of content for the target format

Output only the final content, nothing else.`;

      const result = await callGroq(
        system,
        `Source content (${sourceFormat}):\n\n${sourceContent}`,
      );
      setOutput(sanitizeOutput(result));
    } catch {
      toast.error("The AI service is busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charLimit = FORMAT_CHAR_LIMITS[targetFormat];
  const charCount = output.length;

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Content Repurposer
        </h3>
        <p className="font-sans text-sm text-stone-500">
          Paste existing content and convert it to a different format - preserving the original voice.
        </p>
      </div>

      {/* Format selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
            From
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setSourceFormat(f)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-full border font-sans transition-all",
                  sourceFormat === f
                    ? "bg-stone-800 border-stone-800 text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300",
                )}
              >
                {FORMAT_ICONS[f]} {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
            To
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setTargetFormat(f)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-full border font-sans transition-all",
                  targetFormat === f
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300",
                  sourceFormat === f && "opacity-30 pointer-events-none",
                )}
              >
                {FORMAT_ICONS[f]} {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice preservation toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPreserveVoice(!preserveVoice)}
          className={cn(
            "h-5 w-9 rounded-full border transition-colors relative",
            preserveVoice ? "bg-primary border-primary" : "bg-stone-200 border-stone-300",
          )}
        >
          <div className={cn(
            "h-3.5 w-3.5 rounded-full bg-white absolute top-0.5 transition-all",
            preserveVoice ? "left-[18px]" : "left-[2px]",
          )} />
        </button>
        <span className="font-sans text-xs text-stone-600">Preserve original voice</span>
      </div>

      {/* Format-specific rules preview */}
      {targetFormat && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-600">
              {FORMAT_ICONS[targetFormat]} {targetFormat} rules
            </p>
          </div>
          <p className="font-sans text-xs text-stone-600 leading-relaxed">
            {FORMAT_SPECIFIC_RULES[targetFormat] ?? "No specific rules."}
          </p>
        </div>
      )}

      {/* Source input */}
      <div className="space-y-1.5">
        <Label className="font-sans text-sm font-medium text-stone-700">
          Your {sourceFormat} content
        </Label>
        <Textarea
          placeholder={`Paste your ${sourceFormat} here...`}
          value={sourceContent}
          onChange={(e) => setSourceContent(e.target.value)}
          rows={6}
          className="rounded-xl border-stone-200 bg-stone-50 text-stone-800 text-sm font-sans resize-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
        />
      </div>

      <Button
        onClick={handleRepurpose}
        disabled={loading}
        className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
      >
        {loading ? "Converting..." : `Convert to ${targetFormat} →`}
      </Button>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-sans text-sm font-medium text-stone-700">
              {FORMAT_ICONS[targetFormat]} {targetFormat}
            </Label>
            <div className="flex items-center gap-2">
              {charLimit && (
                <span className={`font-sans text-xs ${
                  charCount > charLimit ? "text-red-500" : "text-stone-400"
                }`}>
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()} chars
                </span>
              )}
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepurpose}
                  className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={8}
            className="rounded-xl border-stone-200 bg-stone-50 text-stone-800 text-sm font-sans resize-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
          />
        </div>
      )}
    </div>
  );
};
