import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  creator: 9999,
  pro: 9999,
};

export const StatsTab = () => {
  const { user, profile } = useAuth();

  const limit = PLAN_LIMITS[profile?.plan ?? "free"] ?? 5;
  const used = profile?.projects_used_this_month ?? 0;
  const isUnlimited = limit === 9999;
  const usagePct = isUnlimited ? 100 : Math.min((used / limit) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-6">
      {/* Empty state banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-sans font-semibold text-stone-800 mb-0.5">
            No content generated yet
          </p>
          <p className="font-sans text-sm text-stone-500 mb-3">
            Generate your first piece of content and your stats will appear here automatically.
          </p>
          <Link to="/dashboard">
            <Button
              size="sm"
              className="rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand text-xs"
            >
              Start generating →
            </Button>
          </Link>
        </div>
      </div>

      {/* Usage ring */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
          This month
        </p>
        <div className="flex items-center gap-6">
          <div className="relative shrink-0 h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#F0EBE3" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="32" fill="none" stroke="#E8743A" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - usagePct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-semibold text-stone-900 leading-none">{used}</span>
              <span className="font-sans text-[10px] text-stone-400">{isUnlimited ? "∞" : `/ ${limit}`}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-stone-500">Generations used</span>
              <span className="font-sans text-sm font-semibold text-stone-900">{used}{isUnlimited ? "" : ` / ${limit}`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-stone-500">Sessions this month</span>
              <span className="font-sans text-sm font-semibold text-stone-900">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-stone-500">Plan</span>
              <span className="font-sans text-sm font-semibold text-stone-900 capitalize">{profile?.plan ?? "free"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* All-time stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total sessions", value: 0 },
          { label: "Formats generated", value: 0 },
          { label: "Day streak", value: 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="font-display text-3xl font-semibold text-[#E8743A]">{s.value}</p>
            <p className="font-sans text-xs text-stone-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Last 7 days activity */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Last 7 days</p>
        <div className="flex items-end gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const label = d.toLocaleDateString("en-US", { weekday: "short" });
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full rounded-lg bg-stone-100 h-4" />
                <span className="font-sans text-[10px] text-stone-400">{label}</span>
              </div>
            );
          })}
        </div>
        <p className="font-sans text-xs text-stone-400 text-center mt-3">
          Activity will appear here after your first generation
        </p>
      </div>

      {/* Top formats */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Most used formats</p>
        <div className="py-6 text-center">
          <p className="font-sans text-sm text-stone-400">Format usage will show up here after you generate content.</p>
        </div>
      </div>

      {/* Fav input + format */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Fav input mode</p>
          <p className="font-sans text-sm text-stone-400">No data yet</p>
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Fav format</p>
          <p className="font-sans text-sm text-stone-400">No data yet</p>
        </div>
      </div>
    </div>
  );
};
