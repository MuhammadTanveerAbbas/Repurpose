import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ALL_FORMATS, FORMAT_ICONS, callGroq } from "@/lib/groq";
import type { ContentFormat } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { Copy, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const RepurposerTool = () => {
  const [sourceFormat, setSourceFormat] =
    useState<ContentFormat>("LinkedIn Post");
  const [targetFormat, setTargetFormat] =
    useState<ContentFormat>("Twitter/X Thread");
  const [sourceContent, setSourceContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRepurpose = async () => {
    if (!sourceContent.trim()) {
      toast.error("Paste your source content first.");
      return;
    }
    if (sourceFormat === targetFormat) {
      toast.error("Pick a different target format.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const system = `You are a content repurposing expert. 
You will receive a piece of content written for ${sourceFormat}.
Your job is to rewrite it specifically for ${targetFormat}, following all platform conventions:
- Respect character limits and structure for ${targetFormat}
- Keep the core message and key insights intact
- Adapt the tone, format, and style to fit ${targetFormat} perfectly
- Do NOT add placeholder text like [your name] or [link]
- Output only the final content, nothing else.`;

      const result = await callGroq(
        system,
        `Source content (${sourceFormat}):\n\n${sourceContent}`,
      );
      setOutput(result);
    } catch {
      toast.error("Groq is being slow — try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-display text-lg text-stone-900 mb-1">
          Content Repurposer
        </h3>
        <p className="font-sans text-sm text-stone-500">
          Paste existing content and convert it to a different format instantly.
        </p>
      </div>

      {/* Format selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
            From
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setSourceFormat(f)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-sans transition-all",
                  sourceFormat === f
                    ? "bg-stone-800 border-stone-800 text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300",
                )}
              >
                {FORMAT_ICONS[f]} {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
            To
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setTargetFormat(f)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-sans transition-all",
                  targetFormat === f
                    ? "bg-[#E8743A] border-[#E8743A] text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300",
                  sourceFormat === f && "opacity-30 pointer-events-none",
                )}
              >
                {FORMAT_ICONS[f]} {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Source input */}
      <div className="space-y-1.5">
        <Label className="font-sans text-sm font-medium text-stone-700">
          Your {sourceFormat} content
        </Label>
        <Textarea
          placeholder={`Paste your ${sourceFormat} here...`}
          value={sourceContent}
          onChange={(e) => setSourceContent(e.target.value)}
          rows={6}
          className="rounded-xl border-stone-200 bg-stone-50 text-stone-800 text-sm font-sans resize-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
        />
      </div>

      <Button
        onClick={handleRepurpose}
        disabled={loading}
        className="w-full h-10 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
      >
        {loading ? "Converting..." : `Convert to ${targetFormat} →`}
      </Button>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-sans text-sm font-medium text-stone-700">
              {FORMAT_ICONS[targetFormat]} {targetFormat}
            </Label>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRepurpose}
                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <Textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={8}
            className="rounded-xl border-stone-200 bg-stone-50 text-stone-800 text-sm font-sans resize-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
          />
        </div>
      )}
    </div>
  );
};
