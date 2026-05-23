import { useState, useCallback } from "react";
import { InputStep } from "./InputStep";
import { StrategyCard } from "./StrategyCard";
import { OutputsSection } from "./OutputsSection";
import type {
  InputMode,
  ContentStrategy,
  ContentFormat,
  GeneratedOutput,
} from "@/lib/groq";
import { analyzeContent, generateAllFormats } from "@/lib/groq";
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
  const [generating, setGenerating] = useState(false);

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

  const handleGenerate = useCallback(async () => {
    if (!strategy || selectedFormats.length === 0) return;

    setGenerating(true);
    const initialOutputs: GeneratedOutput[] = selectedFormats.map((f) => ({
      format: f,
      content: "",
      done: false,
    }));
    setOutputs(initialOutputs);
    setStep("outputs");

    const completedOutputs: GeneratedOutput[] = [];

    const onProgress = (format: ContentFormat, content: string, error?: string) => {
      setOutputs((prev) =>
        prev.map((o) =>
          o.format === format
            ? { ...o, content: content || (error ? "Generation failed. Hit regenerate to retry." : "") }
            : o,
        ),
      );
      if (content) {
        completedOutputs.push({ format, content, done: false });
      }
    };

    await generateAllFormats(selectedFormats, strategy, rawInput, onProgress);
    setGenerating(false);

    if (user && strategy) {
      try {
        const { error } = await supabase.from("projects").insert({
          user_id: user.id,
          title: strategy.core_message.slice(0, 100),
          source_type: inputMode === "youtube" ? "youtube" : "paste",
          transcript: rawInput,
          selected_outputs: selectedFormats,
          status: "completed",
          output_count: completedOutputs.length,
        });

        if (!error) {
          const { error: rpcError } = await supabase.rpc(
            "increment_projects_used",
            { user_id: user.id },
          );
          if (rpcError) {
            console.error("Failed to increment usage counter:", rpcError);
          }
          await refreshProfile();
        }
      } catch {
        // Non-fatal
      }
    }
  }, [strategy, selectedFormats, rawInput, user, inputMode, refreshProfile]);

  const handleRegenerate = async (format: ContentFormat) => {
    if (!strategy) return;
    setOutputs((prev) =>
      prev.map((o) => (o.format === format ? { ...o, content: "" } : o)),
    );
    try {
      const { generateFormat } = await import("@/lib/groq");
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
          loading={generating}
        />
      )}
      {step === "outputs" && strategy && (
        <OutputsSection
          outputs={outputs}
          strategy={strategy}
          generating={generating}
          onRegenerate={handleRegenerate}
          onMarkDone={handleMarkDone}
          onUpdateContent={handleUpdateContent}
          onStartNew={handleStartNew}
        />
      )}
    </div>
  );
};
