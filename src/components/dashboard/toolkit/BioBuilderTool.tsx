import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callGroq, checkAndIncrementUsage } from "@/lib/groq";
import { Copy, CheckCircle2 } from "lucide-react";
import { sanitizeOutput } from "@/lib/sanitize";
import { toast } from "sonner";

interface BioOutputs {
  linkedin: string;
  twitter: string;
  tagline: string;
  instagram: string;
  website_hero: string;
}

const STEPS = [
  { question: "What do you do?", hint: "e.g. I build MVPs for non-technical founders", detail: "Be specific about your role and niche." },
  { question: "Who do you help?", hint: "e.g. Solo founders who want to ship fast", detail: "Define your ideal client/customer." },
  { question: "What result do you deliver?", hint: "e.g. Shipped 30+ products in 3 years", detail: "Quantifiable outcomes or track record." },
  { question: "What are you building now?", hint: "e.g. A SaaS tool for content creators", detail: "Current focus or upcoming project." },
  { question: "What makes you unique?", hint: "e.g. I'm the only one combining X with Y", detail: "Your unfair advantage or unique approach." },
];

export const BioBuilderTool = () => {
  const [answers, setAnswers] = useState(["", "", "", "", ""]);
  const [output, setOutput] = useState<BioOutputs | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (answers.some((a) => !a.trim())) {
      toast.error("Fill in all 5 fields first.");
      return;
    }
    setLoading(true);
    setOutput(null);

    try {
      await checkAndIncrementUsage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Usage limit reached");
      setLoading(false);
      return;
    }

    try {
      const system = `You are a world-class personal branding copywriter. You've written bios for founders who've gone viral, raised funding, and built audiences.

Based on the 5 answers provided, generate 5 distinct copy pieces:

1. **LinkedIn Bio** (3 sentences, third-person):
   - Sentence 1: Position + niche + specific outcome
   - Sentence 2: Proof + credibility (metrics, notable work, years)
   - Sentence 3: Current focus + what they're open to
   - No buzzwords: no "passionate", "results-driven", "thought leader", "guru"
   - Under 100 words total

2. **Twitter/X Bio** (1-2 lines, first-person):
   - Under 160 characters
   - Punchy, quotable, specific
   - End with a subtle CTA or identity marker

3. **Website Tagline** (under 8 words):
   - Bold, benefit-driven, memorable
   - Could go on a hero section

4. **Instagram Bio** (1 line + 1-3 line breaks):
   - Identity + value + emoji (max 2 emojis)
   - Under 150 characters
   - Include a subtle CTA or link mention

5. **Website Hero Headline** (1 line):
   - The ONE thing you want someone to know in 5 seconds
   - Under 12 words
   - Good enough to be the H1 on their landing page

Return ONLY valid JSON:
{
  "linkedin": "...",
  "twitter": "...",
  "tagline": "...",
  "instagram": "...",
  "website_hero": "..."
}`;

      const userMsg = `What I do: ${answers[0]}
Who I help: ${answers[1]}
My result/track record: ${answers[2]}
What I'm building now: ${answers[3]}
What makes me unique: ${answers[4]}`;

      const raw = await callGroq(system, userMsg);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("parse");
      setOutput(JSON.parse(match[0]) as BioOutputs);
    } catch {
      toast.error("The AI service is busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  type BioOutputItem = {
    key: keyof BioOutputs;
    label: string;
    value: string;
    charLimit?: number;
  };

  const outputs: BioOutputItem[] = output
    ? [
        { key: "linkedin", label: "💼 LinkedIn Bio", value: output.linkedin },
        { key: "twitter", label: "🐦 Twitter/X Bio", value: output.twitter, charLimit: 160 },
        { key: "tagline", label: "✨ Website Tagline", value: output.tagline, charLimit: 60 },
        { key: "instagram", label: "📸 Instagram Bio", value: output.instagram, charLimit: 150 },
        { key: "website_hero", label: "🚀 Hero Headline", value: output.website_hero, charLimit: 80 },
      ]
    : [];

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Bio Builder
        </h3>
        <p className="font-sans text-sm text-stone-500">
          Answer 5 quick questions. Get a LinkedIn bio, Twitter bio, website tagline, Instagram bio, and hero headline.
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={step.question} className="space-y-1">
            <Label className="font-sans text-sm font-medium text-stone-700">
              <span className="text-amber-500 font-semibold mr-1">{i + 1}.</span> {step.question}
            </Label>
            <Input
              placeholder={step.hint}
              value={answers[i]}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              className="h-10 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
      >
        {loading ? "Building bios..." : "Build my bios →"}
      </Button>

      {output && (
        <div className="space-y-3">
          {outputs.map(({ key, label, value, charLimit }) => (
            <div key={key} className="bg-stone-50 border border-stone-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {charLimit && (
                    <span className={`font-sans text-[10px] ${
                      value.length > charLimit ? "text-red-500" : "text-stone-400"
                    }`}>
                      {value.length}/{charLimit}
                    </span>
                  )}
                  <button
                    onClick={() => handleCopy(key, value)}
                    className="h-6 w-6 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-600 transition-colors"
                  >
                    {copied === key ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="font-sans text-sm text-stone-800 leading-relaxed">
                {sanitizeOutput(value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
