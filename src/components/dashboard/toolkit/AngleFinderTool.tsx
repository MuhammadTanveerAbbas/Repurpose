import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callGroq, FORMAT_ICONS } from "@/lib/groq";
import type { ContentFormat } from "@/lib/groq";
import { Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Angle {
  angle: string;
  description: string;
  format: string;
  hook: string;
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
      const system = `You are a content strategist for solo founders and creators.
For the given topic, generate exactly 8 different content angles.
Each angle must be genuinely different — different perspective, different audience emotion, different narrative approach.

For each angle provide:
- angle: the angle name (e.g. "The Contrarian Take", "The Beginner's Journey")
- description: 1 sentence explaining the angle
- format: the best content format for this angle (choose from: LinkedIn Post, LinkedIn Hook, Twitter/X Thread, Short-form Video Script, Cold Email Draft, Newsletter Section, YouTube Description, Instagram Caption, Personal Brand Bio Update)
- hook: a ready-to-use opening line for this angle

Return ONLY valid JSON array, no extra text:
[
  {
    "angle": "...",
    "description": "...",
    "format": "...",
    "hook": "..."
  }
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
          Know what to write about but not how to approach it? Get 8 angles with
          a hook for each.
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
            className="h-10 px-4 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand shrink-0 transition-all active:scale-[0.98]"
          >
            {loading ? "..." : "Find angles"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-stone-100 animate-pulse"
            />
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
                    <div className="flex items-center gap-2 mb-0.5">
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
                    <p className="font-sans text-sm text-stone-800 leading-relaxed italic">
                      "{angle.hook}"
                    </p>
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
