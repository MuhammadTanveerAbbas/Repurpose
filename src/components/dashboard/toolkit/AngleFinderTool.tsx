import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callGroq, checkAndIncrementUsage, FORMAT_ICONS } from "@/lib/groq";
import type { ContentFormat } from "@/lib/groq";
import { Copy, CheckCircle2, Sparkles } from "lucide-react";
import { sanitizeOutput } from "@/lib/sanitize";
import { toast } from "sonner";

interface Angle {
  angle: string;
  description: string;
  format: string;
  hook: string;
  distribution_advice: string;
}

export const AngleFinderTool = () => {
  const [topic, setTopic] = useState("");
  const [angles, setAngles] = useState<Angle[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }
    setLoading(true);
    setAngles([]);

    try {
      await checkAndIncrementUsage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Usage limit reached");
      setLoading(false);
      return;
    }

    try {
      const system = `You are a senior content strategist who plans content for 7-figure creators and founders.

For the given topic, generate exactly 8 completely DIFFERENT content angles. Every angle must offer a genuinely unique perspective, not a minor variation.

THE 8 ANGLE FRAMEWORKS (use each exactly once):

1. **The Contrarian** — Argue against the popular opinion. "Everyone says X, but here's why the opposite is true."
2. **The Beginner's Journey** — Frame it as a lesson learned through trial and error. "What I wish I knew before starting [topic]."
3. **The Data-Driven** — Lead with a specific number, stat, or case study. "I analyzed 100 [things] and found X pattern."
4. **The Vulnerability Play** — Open with a failure, doubt, or mistake, then reveal the lesson.
5. **The Prediction** — Make a forward-looking claim. "Here's what [topic] looks like in 2027."
6. **The Step-by-Step** — Break it down as a repeatable system or framework. "The 3-step system for [outcome]."
7. **The Comparison** — Compare two approaches with a clear winner. "Strategy A vs Strategy B — which actually works?"
8. **The Insider Secret** — Share something most people in your space don't know or won't say.

For each angle provide:
- angle: a short, punchy name (3-5 words)
- description: ONE sentence that hooks a reader into wanting this angle
- format: the single BEST content format for this angle (choose from: LinkedIn Post, LinkedIn Hook, Twitter/X Thread, Short-form Video Script, Cold Email Draft, Newsletter Section, YouTube Description, Instagram Caption, Personal Brand Bio Update)
- hook: a ready-to-use opening line (1 sentence, under 20 words) optimized for that format
- distribution_advice: ONE sentence on where and how to publish this (specific platform + posting strategy)

Return ONLY valid JSON:
[
  {
    "angle": "The Contrarian Take",
    "description": "Challenge the status quo and position yourself as the one who tells the truth.",
    "format": "Twitter/X Thread",
    "hook": "The most expensive advice I've ever received was completely wrong.",
    "distribution_advice": "Post as a 5-tweet thread on Tuesday, pin to profile, repurpose hook as a LinkedIn post."
  },
  ...
]`;

      const raw = await callGroq(system, `Topic: ${topic}`);
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("parse");
      const parsed: Angle[] = JSON.parse(match[0]);
      setAngles(parsed);
    } catch {
      toast.error("Groq is being slow — try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (hook: string, idx: number) => {
    navigator.clipboard.writeText(hook);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Content Angle Finder
        </h3>
        <p className="font-sans text-sm text-stone-500">
          8 distinct content angles — each with a hook, format recommendation, and distribution strategy.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm font-medium text-stone-700">
          Topic
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder='e.g. "Pricing your freelance services"'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand shrink-0 transition-all active:scale-[0.98]"
          >
            {loading ? "..." : "Find angles"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {angles.length > 0 && (
        <div className="space-y-3">
          {angles.map((angle, i) => {
            const icon = FORMAT_ICONS[angle.format as ContentFormat] ?? "📝";
            return (
              <div
                key={i}
                className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-xs font-semibold text-amber-500 uppercase tracking-wider">
                        {angle.angle}
                      </span>
                      <span className="font-sans text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        {icon} {angle.format}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-stone-500 mb-2">
                      {angle.description}
                    </p>
                    <p className="font-sans text-sm text-stone-800 leading-relaxed italic border-l-2 border-amber-300 pl-3">
                      "{sanitizeOutput(angle.hook)}"
                    </p>
                    {angle.distribution_advice && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <Sparkles className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <p className="font-sans text-[11px] text-stone-500 leading-relaxed">
                          {angle.distribution_advice}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(angle.hook, i)}
                    className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-600 transition-colors mt-0.5"
                    title="Copy hook"
                  >
                    {copiedIdx === i ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
