import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OutputCard } from "./OutputCard";
import type {
  ContentStrategy,
  ContentFormat,
  GeneratedOutput,
} from "@/lib/groq";
import { FORMAT_ICONS } from "@/lib/groq";
import { Download, Copy, RotateCcw } from "lucide-react";
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

  const handleCopyAll = () => {
    const text = outputs
      .filter((o) => o.content)
      .map((o) => `## ${FORMAT_ICONS[o.format]} ${o.format}\n\n${o.content}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("All outputs copied!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportMarkdown = () => {
    const text = outputs
      .filter((o) => o.content)
      .map((o) => `## ${FORMAT_ICONS[o.format]} ${o.format}\n\n${o.content}`)
      .join("\n\n---\n\n");
    const header = `# Content Strategy\n\n**Core Message:** ${strategy.core_message}\n**Audience:** ${strategy.audience}\n**Tone:** ${strategy.tone}\n\n---\n\n`;
    const blob = new Blob([header + text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content-outputs.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown!");
  };

  const completedCount = outputs.filter((o) => o.content).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl text-stone-900">
            {generating
              ? "Generating..."
              : `${completedCount} of ${outputs.length} ready`}
          </h2>
          <p className="font-sans text-xs text-stone-400 mt-0.5">
            {strategy.core_message}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Output cards */}
      <div className="space-y-4">
        {outputs.map((output) => (
          <OutputCard
            key={output.format}
            output={output}
            onRegenerate={() => onRegenerate(output.format)}
            onMarkDone={() => onMarkDone(output.format)}
            onUpdateContent={(content) =>
              onUpdateContent(output.format, content)
            }
          />
        ))}
      </div>
    </div>
  );
};
