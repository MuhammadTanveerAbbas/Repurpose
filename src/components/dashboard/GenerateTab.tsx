import { useState } from "react";
import { InputStep } from "./InputStep";
import { StrategyCard } from "./StrategyCard";
import { OutputsSection } from "./OutputsSection";
import type {
  InputMode,
  ContentStrategy,
  ContentFormat,
  GeneratedOutput,
} from "@/lib/groq";
import { analyzeContent, generateFormat } from "@/lib/groq";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Step = "input" | "strategy" | "outputs";

export const GenerateTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("idea");
  const [rawInput, setRawInput] = useState("");
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [generatingLoading, setGeneratingLoading] = useState(false);

  const planLimits: Record<string, number> = {
    free: 5,
    creator: 9999,
    pro: 9999,
  };
  const limit = planLimits[profile?.plan ?? "free"] ?? 5;
  const used = profile?.projects_used_this_month ?? 0;

  const handleAnalyze = async (mode: InputMode, input: string) => {
    if (used >= limit) {
      toast.error("You've hit your monthly limit. Upgrade to keep going.");
      return;
    }
    setInputMode(mode);
    setRawInput(input);
    setAnalyzingLoading(true);
    try {
      const result = await analyzeContent(input, mode);
      setStrategy(result);
      setSelectedFormats(result.recommended_formats);
      setStep("strategy");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Groq is being slow, try again.",
      );
    } finally {
      setAnalyzingLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!strategy) return;
    setGeneratingLoading(true);
    setOutputs(
      selectedFormats.map((f) => ({ format: f, content: "", done: false })),
    );
    setStep("outputs");

    const results: GeneratedOutput[] = [];

    for (const format of selectedFormats) {
      try {
        const content = await generateFormat(format, strategy, rawInput);
        results.push({ format, content, done: false });
        setOutputs([
          ...results,
          ...selectedFormats
            .slice(results.length)
            .map((f) => ({ format: f, content: "", done: false })),
        ]);
      } catch {
        results.push({
          format,
          content: "Generation failed. Hit regenerate to retry.",
          done: false,
        });
        setOutputs([
          ...results,
          ...selectedFormats
            .slice(results.length)
            .map((f) => ({ format: f, content: "", done: false })),
        ]);
      }
    }

    setGeneratingLoading(false);

    // Save to Supabase
    if (user && strategy) {
      try {
        const outputsMap: Record<string, string> = {};
        results.forEach((r) => {
          outputsMap[r.format] = r.content;
        });

        const { error } = await supabase.from("projects").insert({
          user_id: user.id,
          title: strategy.core_message.slice(0, 100),
          source_type: inputMode === "youtube" ? "youtube" : "paste",
          transcript: rawInput,
          selected_outputs: selectedFormats,
          status: "completed",
          output_count: results.length,
        });

        if (error) {
          // Non-fatal — outputs are still shown
        } else {
          // Increment usage counter
          await supabase
            .from("profiles")
            .update({ projects_used_this_month: used + 1 })
            .eq("id", user.id);
          await refreshProfile();
        }
      } catch {
        // Non-fatal
      }
    }
  };

  const handleRegenerate = async (format: ContentFormat) => {
    if (!strategy) return;
    setOutputs((prev) =>
      prev.map((o) => (o.format === format ? { ...o, content: "" } : o)),
    );
    try {
      const content = await generateFormat(format, strategy, rawInput);
      setOutputs((prev) =>
        prev.map((o) => (o.format === format ? { ...o, content } : o)),
      );
    } catch {
      toast.error("Regeneration failed. Try again.");
      setOutputs((prev) =>
        prev.map((o) =>
          o.format === format
            ? { ...o, content: "Generation failed. Hit regenerate to retry." }
            : o,
        ),
      );
    }
  };

  const handleMarkDone = (format: ContentFormat) => {
    setOutputs((prev) =>
      prev.map((o) => (o.format === format ? { ...o, done: !o.done } : o)),
    );
  };

  const handleUpdateContent = (format: ContentFormat, content: string) => {
    setOutputs((prev) =>
      prev.map((o) => (o.format === format ? { ...o, content } : o)),
    );
  };

  const handleStartNew = () => {
    if (!confirm("Start over? Your current outputs will be cleared.")) return;
    setStep("input");
    setRawInput("");
    setStrategy(null);
    setSelectedFormats([]);
    setOutputs([]);
  };

  return (
    <div>
      {step === "input" && (
        <InputStep
          onAnalyze={handleAnalyze}
          loading={analyzingLoading}
          usageUsed={used}
          usageLimit={limit}
        />
      )}
      {step === "strategy" && strategy && (
        <StrategyCard
          strategy={strategy}
          selectedFormats={selectedFormats}
          onToggleFormat={(f) =>
            setSelectedFormats((prev) =>
              prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
            )
          }
          onGenerate={handleGenerate}
          onBack={() => setStep("input")}
          loading={generatingLoading}
        />
      )}
      {step === "outputs" && strategy && (
        <OutputsSection
          outputs={outputs}
          strategy={strategy}
          generating={generatingLoading}
          onRegenerate={handleRegenerate}
          onMarkDone={handleMarkDone}
          onUpdateContent={handleUpdateContent}
          onStartNew={handleStartNew}
        />
      )}
    </div>
  );
};
