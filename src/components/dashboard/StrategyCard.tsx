import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_FORMATS, FORMAT_ICONS, FORMAT_PLATFORM_TIPS } from "@/lib/groq";
import type { ContentStrategy, ContentFormat } from "@/lib/groq";
import { ArrowLeft, Lightbulb, Target, Zap, MessageCircle } from "lucide-react";

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
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">🧠</span>
          <h2 className="font-display text-xl text-stone-900">
            Content Strategy
          </h2>
        </div>

        {/* Core insight row */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="h-4 w-4 text-amber-500" />
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-600">
              Core Message
            </p>
          </div>
          <p className="font-sans text-sm text-stone-800 font-medium leading-relaxed">
            {strategy.core_message}
          </p>
        </div>

        {/* Strategy grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Audience
            </p>
            <p className="font-sans text-sm text-stone-800 leading-relaxed">
              {strategy.audience}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Tone
            </p>
            <p className="font-sans text-sm text-stone-800 font-medium">
              {strategy.tone}
            </p>
          </div>

          {strategy.hook_ideas && strategy.hook_ideas.length > 0 && (
            <div className="sm:col-span-2 bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Hook Ideas
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {strategy.hook_ideas.map((hook, i) => (
                  <span key={i} className="font-sans text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700">
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          )}

          {strategy.emotional_triggers && strategy.emotional_triggers.length > 0 && (
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-amber-500" />
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Emotional Triggers
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {strategy.emotional_triggers.map((t, i) => (
                  <span key={i} className="font-sans text-xs bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {strategy.content_pillars && strategy.content_pillars.length > 0 && (
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Content Pillars
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {strategy.content_pillars.map((p, i) => (
                  <span key={i} className="font-sans text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Strategy note */}
        <div className="bg-gradient-to-r from-amber-50 to-stone-50 rounded-xl p-4 mb-5 border border-amber-100/50">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            Growth Strategy
          </p>
          <p className="font-sans text-sm text-stone-700 leading-relaxed">
            {strategy.strategy_note}
          </p>
        </div>

        {/* Format selector */}
        <div className="mb-5">
          <p className="font-sans text-sm font-medium text-stone-700 mb-3">
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
          <div className="flex items-center justify-between mt-2">
            <p className="font-sans text-xs text-stone-400">
              ★ = AI recommended · {selectedFormats.length} selected
            </p>
            {selectedFormats.length > 1 && (
              <p className="font-sans text-xs text-amber-600">
                Generated in parallel ✨
              </p>
            )}
          </div>
        </div>

        {/* Platform tips for selected formats */}
        {selectedFormats.length > 0 && selectedFormats.length <= 3 && (
          <div className="bg-stone-50 rounded-xl p-3 mb-4 space-y-1.5">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Platform Tips
            </p>
            {selectedFormats.map((f) => (
              <p key={f} className="font-sans text-xs text-stone-600">
                <span className="font-medium">{FORMAT_ICONS[f]} {f}:</span> {FORMAT_PLATFORM_TIPS[f]}
              </p>
            ))}
          </div>
        )}

        <Button
          onClick={onGenerate}
          disabled={loading || selectedFormats.length === 0}
          className="w-full h-11 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
        >
          {loading
            ? "Generating..."
            : `Generate ${selectedFormats.length} format${selectedFormats.length !== 1 ? "s" : ""} →`}
        </Button>
      </div>
    </div>
  );
};
