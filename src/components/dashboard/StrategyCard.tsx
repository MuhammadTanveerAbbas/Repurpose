import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_FORMATS, FORMAT_ICONS } from "@/lib/groq";
import type { ContentStrategy, ContentFormat } from "@/lib/groq";
import { ArrowLeft } from "lucide-react";

interface Props {
  strategy: ContentStrategy;
  selectedFormats: ContentFormat[];
  onToggleFormat: (f: ContentFormat) => void;
  onGenerate: () => void;
  onBack: () => void;
  loading: boolean;
}

export const StrategyCard = ({
  strategy,
  selectedFormats,
  onToggleFormat,
  onGenerate,
  onBack,
  loading,
}: Props) => {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 font-sans mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🧠</span>
          <h2 className="font-display text-xl text-stone-900">
            Content Strategy
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Core Message
            </p>
            <p className="font-sans text-sm text-stone-800 leading-relaxed">
              {strategy.core_message}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Audience
            </p>
            <p className="font-sans text-sm text-stone-800">
              {strategy.audience}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">
              Recommended Tone
            </p>
            <p className="font-sans text-sm text-stone-800 font-medium">
              {strategy.tone}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Strategy Note
            </p>
            <p className="font-sans text-sm text-stone-800 leading-relaxed">
              {strategy.strategy_note}
            </p>
          </div>
        </div>

        {/* Format selector */}
        <div className="mb-5">
          <p className="font-sans text-sm font-medium text-stone-700 mb-2">
            Select formats to generate
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_FORMATS.map((format) => {
              const isSelected = selectedFormats.includes(format);
              const isRecommended =
                strategy.recommended_formats.includes(format);
              return (
                <button
                  key={format}
                  onClick={() => onToggleFormat(format)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-sans border transition-all",
                    isSelected
                      ? "bg-[#E8743A] border-[#E8743A] text-white"
                      : "bg-white border-stone-200 text-stone-600 hover:border-stone-300",
                    isRecommended &&
                      !isSelected &&
                      "border-amber-300 text-amber-700 bg-amber-50",
                  )}
                >
                  <span>{FORMAT_ICONS[format]}</span>
                  {format}
                  {isRecommended && !isSelected && (
                    <span className="text-[10px] text-amber-500">★</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="font-sans text-xs text-stone-400 mt-2">
            ★ = AI recommended · {selectedFormats.length} selected
          </p>
        </div>

        <Button
          onClick={onGenerate}
          disabled={loading || selectedFormats.length === 0}
          className="w-full h-11 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
        >
          {loading
            ? "Generating..."
            : `Looks good, generate ${selectedFormats.length > 0 ? `${selectedFormats.length} formats` : ""} →`}
        </Button>
      </div>
    </div>
  );
};
