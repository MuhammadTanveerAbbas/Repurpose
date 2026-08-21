import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callGroq, checkAndIncrementUsage } from "@/lib/groq";
import { Copy, CheckCircle2 } from "lucide-react";
import { sanitizeOutput } from "@/lib/sanitize";
import { toast } from "sonner";

interface Hook {
  style: string;
  text: string;
  hook_rating: number;
  why_it_works: string;
}

const HOOK_CATEGORIES = [
  { value: "all", label: "All styles" },
  { value: "linkedin", label: "LinkedIn-optimized" },
  { value: "twitter", label: "Twitter/X-optimized" },
  { value: "video", label: "Video hooks" },
  { value: "email", label: "Email subject lines" },
];

export const HookGeneratorTool = () => {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("all");
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }
    setLoading(true);
    setHooks([]);

    try {
      await checkAndIncrementUsage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Usage limit reached");
      setLoading(false);
      return;
    }

    const categoryInstruction = category === "linkedin"
      ? "Optimize these hooks specifically for LinkedIn - first 3 lines must create curiosity gap. No clickbait."
      : category === "twitter"
        ? "Optimize these hooks for Twitter/X - each under 240 characters, punchy, quotable."
        : category === "video"
          ? "Optimize these hooks for short-form video (TikTok/Reels/Shorts) - visual, pattern-interrupting, spoken-word friendly."
          : category === "email"
            ? "Write these as email subject lines - under 8 words, curiosity-driven, no spam patterns."
            : "";

    try {
      const system = `You are a world-class direct response copywriter who has written hooks generating millions of impressions.

Generate exactly 10 hooks for the given topic. Each hook uses a DIFFERENT psychological trigger.

THE 10 HOOK STYLES (use one per hook, in this order):
1. **Contrarian** - Challenge a widely held belief. "Everyone says X, but here's why they're wrong."
2. **Curiosity Gap** - Tease something surprising without revealing it. "I tried [strategy] for 30 days. I didn't expect what happened."
3. **Specific Number** - Lead with a concrete data point or result. "I turned $500 into $50k in 90 days using one rule."
4. **Vulnerable Admission** - Share a failure or insecurity first. "I almost quit my business 3 times last year."
5. **Pattern Interrupt** - Say something that makes the reader literally stop. "Stop doing [common thing]. It's costing you [result]."
6. **Bold Claim** - Make a confident, slightly controversial statement. "[Topic] is dead. Here's what replaces it."
7. **Relatable Frustration** - Name a pain they feel daily. "You know that feeling when [specific frustration]? Me too."
8. **Story Opener** - Start mid-action or mid-dialogue. ""I can't believe you just said that," my client said..."
9. **Direct Address** - Speak to them personally with a specific identity. "If you're a [specific person] who wants [specific result], read this."
10. **Ultimate Outcome** - Lead with the transformation. "This one change doubled my revenue in 30 days."

RULES:
- Each hook must be 1-2 sentences max
- No fluff, no "In today's world", no "I'm excited to share"
- Write hooks so compelling they could be posted as-is
- ${categoryInstruction}
- Also rate each hook 1-10 and explain in 5 words WHY it works

Return ONLY valid JSON:
[
  { "style": "Contrarian", "text": "...", "hook_rating": 9, "why_it_works": "Challenges status quo" },
  ...
]`;

      const raw = await callGroq(system, `Topic: ${topic}`);
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("parse");
      const parsed: Hook[] = JSON.parse(match[0]);
      setHooks(parsed);
    } catch {
      toast.error("The AI service is busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sortedHooks = [...hooks].sort((a, b) => (b.hook_rating ?? 0) - (a.hook_rating ?? 0));

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Hook Generator
        </h3>
        <p className="font-sans text-sm text-stone-500">
          10 scroll-stopping hooks - each using a different psychological trigger. Rated by impact.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="font-sans text-sm font-medium text-stone-700">
          Topic or idea
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder='e.g. "Why most freelancers undercharge"'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 h-10 rounded-xl border-stone-200 font-sans text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOOK_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="font-sans text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand shrink-0 transition-all active:scale-[0.98]"
          >
            {loading ? "..." : "Generate"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {sortedHooks.length > 0 && (
        <div className="space-y-2">
          {sortedHooks.map((hook, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-stone-50 border border-stone-100 rounded-xl p-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                    {hook.style}
                  </span>
                  {hook.hook_rating && (
                    <span className={`font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      hook.hook_rating >= 9 ? "bg-green-100 text-green-700" :
                      hook.hook_rating >= 7 ? "bg-amber-100 text-amber-700" :
                      "bg-stone-100 text-stone-500"
                    }`}>
                      {hook.hook_rating}/10
                    </span>
                  )}
                  {hook.why_it_works && (
                    <span className="font-sans text-[10px] text-stone-400 hidden sm:inline">
                      · {hook.why_it_works}
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-stone-800 leading-relaxed">
                  {sanitizeOutput(hook.text)}
                </p>
              </div>
              <button
                onClick={() => handleCopy(hook.text, i)}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-600 transition-colors"
              >
                {copiedIdx === i ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
