import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, FileText, Link as LinkIcon, Frown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputMode } from "@/lib/groq";
import { toast } from "sonner";

interface Props {
  onAnalyze: (mode: InputMode, input: string) => void;
  loading: boolean;
  usageUsed: number;
  usageLimit: number;
}

export const InputStep = ({
  onAnalyze,
  loading,
  usageUsed,
  usageLimit,
}: Props) => {
  const [mode, setMode] = useState<InputMode>("idea");
  const [input, setInput] = useState("");

  const modes: {
    value: InputMode;
    label: string;
    icon: React.ReactNode;
    placeholder: string;
  }[] = [
    {
      value: "idea",
      label: "Idea",
      icon: <Lightbulb className="h-4 w-4" />,
      placeholder:
        "e.g. I charge $5k for MVP builds and people still lowball me",
    },
    {
      value: "transcript",
      label: "Transcript",
      icon: <FileText className="h-4 w-4" />,
      placeholder: "Paste your raw transcript here...",
    },
    {
      value: "youtube",
      label: "YouTube URL",
      icon: <LinkIcon className="h-4 w-4" />,
      placeholder: "https://www.youtube.com/watch?v=...",
    },
    {
      value: "pain_point",
      label: "Pain Point",
      icon: <Frown className="h-4 w-4" />,
      placeholder: "e.g. Clients expect unlimited revisions for a fixed price",
    },
  ];

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("Please enter something first.");
      return;
    }

    if (mode === "youtube") {
      const videoIdMatch = input.match(/(?:v=|\/)([\w-]{11})/);
      if (!videoIdMatch) {
        toast.error("Invalid YouTube URL. Try again.");
        return;
      }
      const videoId = videoIdMatch[1];
      try {
        const res = await fetch(
          `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const transcript = data.map((t: { text: string }) => t.text).join(" ");
        if (!transcript) throw new Error();
        onAnalyze("youtube", transcript);
      } catch {
        toast.error("Couldn't fetch transcript. Paste it manually instead.");
      }
    } else {
      onAnalyze(mode, input);
    }
  };

  const currentMode = modes.find((m) => m.value === mode)!;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-xl text-stone-900 mb-1">
          What do you want to create?
        </h2>
        <p className="font-sans text-sm text-stone-500 mb-5">
          Pick an input mode and give me something to work with.
        </p>

        {/* Mode selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all font-sans text-sm",
                mode === m.value
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-white border-stone-200 text-stone-600 hover:border-stone-300",
              )}
            >
              {m.icon}
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Input field */}
        <div className="space-y-1.5 mb-5">
          <Label className="font-sans text-sm font-medium text-stone-700">
            {currentMode.label}
          </Label>
          {mode === "youtube" ? (
            <Input
              placeholder={currentMode.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
            />
          ) : (
            <Textarea
              placeholder={currentMode.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans resize-none"
            />
          )}
        </div>

        {/* Usage indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-sans text-xs text-stone-400">
            {usageUsed}/{usageLimit} generations used this month
          </span>
          {usageUsed >= usageLimit && (
            <span className="font-sans text-xs text-red-500 font-medium">
              Limit reached
            </span>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || usageUsed >= usageLimit}
          className="w-full h-11 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
        >
          {loading ? "Analyzing..." : "Analyze & Plan →"}
        </Button>
      </div>
    </div>
  );
};
