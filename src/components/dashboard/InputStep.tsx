import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, FileText, Link as LinkIcon, Frown } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseYouTubeId } from "@/lib/youtube";
import type { InputMode } from "@/lib/groq";
import { supabase } from "@/integrations/supabase/client";
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
  const [fetchingTranscript, setFetchingTranscript] = useState(false);

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

  const busy = loading || fetchingTranscript;

  const fetchYouTubeTranscript = async () => {
    const videoId = parseYouTubeId(input);
    if (!videoId) {
      toast.error("Invalid YouTube URL. Paste a valid video link.");
      return;
    }

    setFetchingTranscript(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const res = await fetch(`/api/transcript?videoId=${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        toast.error(
          data?.error ?? "Couldn't fetch this transcript. Paste it manually instead.",
        );
        return;
      }

      const transcript = data
        .map((t: { text?: string }) => t.text ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!transcript) {
        toast.error("This video has no usable captions. Paste it manually instead.");
        return;
      }

      onAnalyze("youtube", transcript);
    } catch {
      toast.error("Network error while fetching. Check your connection and try again.");
    } finally {
      setFetchingTranscript(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      toast.error("Please enter something first.");
      return;
    }
    if (mode === "youtube") {
      void fetchYouTubeTranscript();
    } else {
      onAnalyze(mode, input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!busy && usageUsed < usageLimit) handleSubmit();
    }
  };

  const currentMode = modes.find((m) => m.value === mode)!;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-stone-100 rounded-2xl p-5 sm:p-6 shadow-sm">
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
              disabled={busy}
              aria-pressed={mode === m.value}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all font-sans text-sm disabled:opacity-60",
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
          <Label
            htmlFor="content-input"
            className="font-sans text-sm font-medium text-stone-700"
          >
            {currentMode.label}
          </Label>
          {mode === "youtube" ? (
            <Input
              id="content-input"
              placeholder={currentMode.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              inputMode="url"
              autoComplete="url"
              className="h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans"
            />
          ) : (
            <Textarea
              id="content-input"
              placeholder={currentMode.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              className="rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans resize-y min-h-[9rem]"
            />
          )}
          {(mode === "transcript" || mode === "idea") && (
            <p className="font-sans text-xs text-stone-400 text-right">
              {input.length.toLocaleString()} characters
            </p>
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
          disabled={busy || usageUsed >= usageLimit}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
        >
          {fetchingTranscript
            ? "Fetching transcript..."
            : loading
              ? "Analyzing..."
              : mode === "youtube"
                ? "Fetch transcript & analyze"
                : "Analyze & plan"}
          {!busy && (
            <span className="hidden sm:inline text-[10px] opacity-60 ml-1.5">
              Ctrl+Enter
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
