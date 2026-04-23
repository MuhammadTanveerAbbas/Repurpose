import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { callGroq } from "@/lib/groq";
import { Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BioOutputs {
  linkedin: string;
  twitter: string;
  tagline: string;
}

const STEPS = [
  "What you do",
  "Who you help",
  "Your result",
  "What you're building",
];

export const BioBuilderTool = () => {
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [output, setOutput] = useState<BioOutputs | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (answers.some((a) => !a.trim())) {
      toast.error("Fill in all 4 fields first.");
      return;
    }
    setLoading(true);
    setOutput(null);
    try {
      const system = `You are a personal branding expert. 
Based on the 4 answers provided, generate 3 bios:

1. LinkedIn Bio (3 sentences, third-person, professional but human. No buzzwords like "passionate" or "guru".)
2. Twitter/X Bio (1–2 lines max, first-person, punchy, under 160 chars)
3. Website Tagline (under 10 words, first-person or second-person, bold and specific)

Return ONLY valid JSON, no extra text:
{
  "linkedin": "...",
  "twitter": "...",
  "tagline": "..."
}`;

      const userMsg = `What I do: ${answers[0]}
Who I help: ${answers[1]}
My result/track record: ${answers[2]}
What I'm building now: ${answers[3]}`;

      const raw = await callGroq(system, userMsg);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("parse");
      setOutput(JSON.parse(match[0]) as BioOutputs);
    } catch {
      toast.error("Groq is being slow — try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const placeholders = [
    "e.g. I build MVPs for non-technical founders",
    "e.g. Solo founders who want to ship fast",
    "e.g. Shipped 30+ products in 3 years",
    "e.g. A SaaS tool for content creators",
  ];

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Bio Builder
        </h3>
        <p className="font-sans text-sm text-stone-500">
          Answer 4 quick questions. Get a LinkedIn bio, Twitter bio, and website
          tagline.
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={step} className="space-y-1.5">
            <Label className="font-sans text-sm font-medium text-stone-700">
              <span className="text-amber-500 font-semibold mr-1">
                {i + 1}.
              </span>{" "}
              {step}
            </Label>
            <Input
              placeholder={placeholders[i]}
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
        className="w-full h-10 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
      >
        {loading ? "Building bios..." : "Build my bios →"}
      </Button>

      {output && (
        <div className="space-y-3">
          {(
            [
              {
                key: "linkedin",
                label: "💼 LinkedIn Bio",
                value: output.linkedin,
              },
              {
                key: "twitter",
                label: "🐦 Twitter/X Bio",
                value: output.twitter,
              },
              {
                key: "tagline",
                label: "✨ Website Tagline",
                value: output.tagline,
              },
            ] as const
          ).map(({ key, label, value }) => (
            <div
              key={key}
              className="bg-stone-50 border border-stone-100 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {label}
                </span>
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
              <p className="font-sans text-sm text-stone-800 leading-relaxed">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
