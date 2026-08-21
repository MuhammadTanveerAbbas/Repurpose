import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FORMAT_ICONS, FORMAT_CHAR_LIMITS } from "@/lib/groq";
import type { GeneratedOutput } from "@/lib/groq";
import { sanitizeOutput } from "@/lib/sanitize";
import { Copy, RefreshCw, CheckCircle2, Sparkles, Download, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

interface Props {
  output: GeneratedOutput;
  onRegenerate: () => void;
  onMarkDone: () => void;
  onUpdateContent: (content: string) => void;
  showPlatformTip?: boolean;
  platformTip?: string;
}

export const OutputCard = ({
  output,
  onRegenerate,
  onMarkDone,
  onUpdateContent,
  showPlatformTip,
  platformTip,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const isLoading = !output.content && !output.error;
  const hasError = !output.content && Boolean(output.error);
  const charLimit = FORMAT_CHAR_LIMITS[output.format];
  const charCount = output.content.length;
  const wordCount = output.content ? output.content.split(/\s+/).filter(Boolean).length : 0;

  const charColor = charLimit
    ? charCount > charLimit
      ? "text-red-500"
      : charCount > charLimit * 0.85
        ? "text-yellow-500"
        : "text-green-600"
    : "text-stone-400";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text manually.");
    }
  };

  const handleDownload = () => {
    const slug = output.format.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const blob = new Blob([output.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "bg-white border rounded-2xl p-5 shadow-sm transition-all",
        output.done
          ? "border-green-200 bg-green-50/30"
          : hasError
            ? "border-red-200 bg-red-50/30"
            : "border-stone-100",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0" aria-hidden="true">
            {FORMAT_ICONS[output.format]}
          </span>
          <span className="font-sans font-semibold text-sm text-stone-800 truncate">
            {output.format}
          </span>
          {output.done && (
            <span className="font-sans text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
              Done
            </span>
          )}
          {isLoading && (
            <span className="font-sans text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse shrink-0">
              Generating...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isLoading && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
                title="Regenerate"
                aria-label="Regenerate this format"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={hasError}
                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
                title="Copy"
                aria-label="Copy content"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={hasError}
                className="hidden sm:inline-flex h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
                title="Download as .txt"
                aria-label="Download as .txt"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkDone}
                disabled={hasError}
                className={cn(
                  "h-7 px-2 rounded-lg text-xs font-sans font-medium",
                  output.done
                    ? "text-green-600 hover:text-stone-600"
                    : "text-stone-400 hover:text-stone-700",
                )}
              >
                {output.done ? "Unmark" : "Mark done"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Platform tip */}
      {showPlatformTip && platformTip && !isLoading && (
        <div className="mb-3 flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-xl p-3">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-stone-500 leading-relaxed">
            {platformTip}
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2" aria-label="Generating content">
          <div className="h-4 bg-stone-100 rounded animate-pulse w-full" />
          <div className="h-4 bg-stone-100 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-stone-100 rounded animate-pulse w-3/5" />
          <div className="h-4 bg-stone-100 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-stone-100 rounded animate-pulse w-2/5" />
        </div>
      ) : hasError ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <TriangleAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="font-sans text-sm text-red-600">
              {sanitizeOutput(output.error ?? "Generation failed.")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={onRegenerate}
            className="shrink-0 h-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <>
          <Textarea
            value={sanitizeOutput(output.content)}
            onChange={(e) => onUpdateContent(e.target.value)}
            rows={8}
            aria-label={`${output.format} content`}
            className="rounded-xl border-stone-200 bg-stone-50 text-stone-800 text-sm font-sans resize-y min-h-[10rem] focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
          />
          <div className="flex justify-between mt-1.5">
            <span className="font-sans text-xs text-stone-400">
              {wordCount} words
            </span>
            <span className={cn("font-sans text-xs", charColor)}>
              {charCount.toLocaleString()}
              {charLimit ? ` / ${charLimit.toLocaleString()} chars` : " chars"}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
