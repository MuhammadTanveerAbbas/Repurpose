import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/BrandIcon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const contentTypes = [
  { value: "podcaster", label: "Podcaster", emoji: "🎙️" },
  { value: "youtuber", label: "YouTuber", emoji: "🎬" },
  { value: "b2b_marketer", label: "B2B Marketer", emoji: "📊" },
  { value: "coach", label: "Coach / Educator", emoji: "🎓" },
];

const outputGoals = [
  { value: "linkedin_growth", label: "LinkedIn growth", emoji: "💼" },
  { value: "newsletter", label: "Newsletter content", emoji: "✉️" },
  { value: "short_form_video", label: "Short-form video scripts", emoji: "📱" },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState("");
  const [outputGoal, setOutputGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ content_type: contentType, output_goal: outputGoal, onboarding_completed: true })
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to save preferences");
    } else {
      await refreshProfile();
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#F8F5F0]">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center gap-2 mb-8">
          <Link to="/" aria-label="Repurpose AI home">
            <BrandIcon className="h-12 w-12" />
          </Link>
          <Link to="/" className="font-display text-xl font-semibold text-stone-900 tracking-tight">
            Repurpose AI
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 1 ? "bg-[#E8743A]" : "bg-stone-200")} />
          <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 2 ? "bg-[#E8743A]" : "bg-stone-200")} />
        </div>

        <h1 className="font-display text-2xl text-stone-900 mb-1">
          {step === 1 ? "What type of content do you create?" : "What's your main goal?"}
        </h1>
        <p className="font-sans text-sm text-stone-500 mb-8 leading-relaxed">
          {step === 1 ? "We'll personalize your templates and defaults." : "We'll prioritize the right output formats."}
        </p>

        {step === 1 ? (
          <div className="grid grid-cols-2 gap-3">
            {contentTypes.map(ct => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                className={cn(
                  "text-left rounded-2xl border-2 p-4 transition-all font-sans",
                  contentType === ct.value
                    ? "border-amber-400 bg-amber-50"
                    : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                )}
              >
                <span className="text-xl mb-1.5 block">{ct.emoji}</span>
                <span className="font-sans text-sm font-semibold text-stone-800">{ct.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {outputGoals.map(og => (
              <button
                key={og.value}
                onClick={() => setOutputGoal(og.value)}
                className={cn(
                  "w-full text-left flex items-center gap-3 rounded-2xl border-2 p-4 transition-all font-sans",
                  outputGoal === og.value
                    ? "border-amber-400 bg-amber-50"
                    : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                )}
              >
                <span className="text-lg">{og.emoji}</span>
                <span className="font-sans text-sm font-semibold text-stone-800">{og.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step === 2 && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 font-sans"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button
              className="flex-1 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
              disabled={!contentType}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          ) : (
            <Button
              className="flex-1 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
              disabled={!outputGoal || loading}
              onClick={handleComplete}
            >
              {loading ? "Saving…" : "Start creating"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
