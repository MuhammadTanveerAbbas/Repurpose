import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callGroq } from "@/lib/groq";
import { Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Hook {
  style: string;
  text: string;
}

export const HookGeneratorTool = () => {
  const [topic, setTopic] = useState("");
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
      const system = `You are a world-class copywriter specialising in scroll-stopping hooks for social media.
Generate exactly 10 hooks for the given topic, each in a different style.
Use these 10 styles in order:
1. Bold Claim
2. Contrarian Take
3. Number/Stat
4. Story Opener
5. Question
6. "I used to think..."
7. Painful Truth
8. Curiosity Gap
9. Direct Address
10. Hot Take

Rules:
- Each hook must be 1–2 sentences max
- No fluff, no "In today's world"
- Make each one genuinely good enough to post
- Return ONLY valid JSON array, no extra text:
[
  { "style": "Bold Claim", "text": "..." },
  { "style": "Contrarian Take", "text": "..." },
  ...
]`;

      const raw = await callGroq(system, `Topic: ${topic}`);
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("parse");
      const parsed: Hook[] = JSON.parse(match[0]);
      setHooks(parsed);
    } catch {
      toast.error("Groq is being slow — try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Hook Generator
        </h3>
        <p className="font-sans text-sm text-stone-500">
          Get 10 scroll-stopping hooks in different styles from any topic.
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
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand shrink-0 transition-all active:scale-[0.98]"
          >
            {loading ? "..." : "Generate"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {hooks.length > 0 && (
        <div className="space-y-2">
          {hooks.map((hook, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-stone-50 border border-stone-100 rounded-xl p-3 group"
            >
              <div className="flex-1 min-w-0">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-500 block mb-0.5">
                  {hook.style}
                </span>
                <p className="font-sans text-sm text-stone-800 leading-relaxed">
                  {hook.text}
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
