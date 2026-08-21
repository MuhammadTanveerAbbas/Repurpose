import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OutputCard } from "./OutputCard";
import type {
  ContentStrategy,
  ContentFormat,
  GeneratedOutput,
} from "@/lib/groq";
import { FORMAT_ICONS, FORMAT_PLATFORM_TIPS } from "@/lib/groq";
import { Download, Copy, RotateCcw, Sparkles } from "lucide-react";
import { sanitizeOutput } from "@/lib/sanitize";
import { toast } from "sonner";

interface Props {
  outputs: GeneratedOutput[];
  strategy: ContentStrategy;
  generating: boolean;
  onRegenerate: (format: ContentFormat) => void;
  onMarkDone: (format: ContentFormat) => void;
  onUpdateContent: (format: ContentFormat, content: string) => void;
  onStartNew: () => void;
}

export const OutputsSection = ({
  outputs,
  strategy,
  generating,
  onRegenerate,
  onMarkDone,
  onUpdateContent,
  onStartNew,
}: Props) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const completedCount = outputs.filter((o) => o.content).length;
  const failedCount = outputs.filter((o) => o.error && !o.content).length;
  const totalCount = outputs.length;
  const isLoading = generating && completedCount + failedCount < totalCount;

  const buildExportText = () =>
    outputs
      .filter((o) => o.content)
      .map((o) => `## ${FORMAT_ICONS[o.format]} ${o.format}\n\n${o.content}`)
      .join("\n\n---\n\n");

  const handleCopyAll = async () => {
    const text = buildExportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success("All outputs copied!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Couldn't copy. Try the export button instead.");
    }
  };

  const handleExportMarkdown = () => {
    const text = buildExportText();
    const header = `# Content Strategy\n\n**Core Message:** ${strategy.core_message}\n**Audience:** ${strategy.audience}\n**Tone:** ${strategy.tone}\n\n---\n\n`;
    const slug =
      strategy.core_message
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "content-outputs";
    const blob = new Blob([header + text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown!");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-stone-900">
            {isLoading
              ? `Generating ${completedCount}/${totalCount}...`
              : `${completedCount} of ${totalCount} ready`}
          </h2>
          <p className="font-sans text-xs text-stone-400 mt-0.5 line-clamp-1">
            {sanitizeOutput(strategy.core_message)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Generating in batches
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            disabled={completedCount === 0}
            className="rounded-xl border-stone-200 text-stone-700 font-sans text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedAll ? "Copied!" : "Copy All"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMarkdown}
            disabled={completedCount === 0}
            className="rounded-xl border-stone-200 text-stone-700 font-sans text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export .md
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStartNew}
            className="rounded-xl border-stone-200 text-stone-700 font-sans text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Start New
          </Button>
        </div>
      </div>

      {/* Failed banner with retry-all */}
      {!generating && failedCount > 0 && completedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="font-sans text-sm text-red-700 flex-1">
            {failedCount} format{failedCount !== 1 ? "s" : ""} failed to generate.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => outputs.forEach((o) => o.error && !o.content && onRegenerate(o.format))}
            className="shrink-0 rounded-xl border-red-300 text-red-600 hover:bg-red-100 font-sans text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry all failed
          </Button>
        </div>
      )}

      {/* Platform tips banner */}
      {completedCount > 0 && completedCount <= 3 && (
        <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-200/50 rounded-2xl p-4 mb-4 hidden sm:block">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
            Publishing Tips
          </p>
          <div className="space-y-1.5">
            {outputs.filter((o) => o.content).map((o) => (
              <p key={o.format} className="font-sans text-xs text-stone-600">
                <span className="font-medium">{FORMAT_ICONS[o.format]} {o.format}:</span> {FORMAT_PLATFORM_TIPS[o.format]}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Output cards */}
      <div className="space-y-4">
        {outputs.map((output, i) => (
          <OutputCard
            key={output.format}
            output={output}
            onRegenerate={() => onRegenerate(output.format)}
            onMarkDone={() => onMarkDone(output.format)}
            onUpdateContent={(content) =>
              onUpdateContent(output.format, content)
            }
            showPlatformTip={i === 0 && completedCount > 0}
            platformTip={FORMAT_PLATFORM_TIPS[output.format]}
          />
        ))}
      </div>

      {/* Completion state */}
      {!isLoading && completedCount === totalCount && completedCount > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="font-sans font-semibold text-green-800 text-sm">
            All {totalCount} formats generated
          </p>
          <p className="font-sans text-xs text-green-600 mt-0.5">
            Copy all, export as markdown, or regenerate individual formats.
          </p>
        </div>
      )}
    </div>
  );
};
