import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, CalendarDays, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FORMAT_ICONS } from "@/lib/groq";
import type { ContentFormat } from "@/lib/groq";
import { getPlanLimit, isUnlimited as checkIsUnlimited } from "@/config/plans";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDayStreak = (projects: { created_at?: string | null }[]): number => {
  const days = new Set(
    projects
      .map((p) => p.created_at?.split("T")[0])
      .filter((d): d is string => Boolean(d)),
  );
  if (days.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayKey = cursor.toISOString().split("T")[0]!;
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().split("T")[0]!;
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const StatsTab = () => {
  const { user, profile } = useAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["history", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, source_type, selected_outputs, output_count, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const limit = getPlanLimit(profile?.plan ?? "free");
  const used = profile?.projects_used_this_month ?? 0;
  const isUnlimited = checkIsUnlimited(limit);
  const usagePct = isUnlimited ? 100 : Math.min((used / limit) * 100, 100);

  const totalSessions = projects.length;
  const totalFormats = projects.reduce((sum, p) => {
    const count = typeof p.output_count === 'number' ? p.output_count : (p.selected_outputs?.length ?? 0);
    return sum + count;
  }, 0);

  const formatCounts: Record<string, number> = {};
  projects.forEach((p) => {
    if (p.selected_outputs) {
      (p.selected_outputs as string[]).forEach((f) => {
        formatCounts[f] = (formatCounts[f] ?? 0) + 1;
      });
    }
  });

  const sourceCounts: Record<string, number> = {};
  projects.forEach((p) => {
    const src = p.source_type ?? "paste";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  });

  // Last 7 days activity — grouped from real project timestamps
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0]!;
    const dayName = WEEKDAYS[d.getDay()]!;
    const count = projects.filter(
      (p) => p.created_at?.startsWith(dateStr),
    ).length;
    return { label: dayName, count, date: dateStr };
  });
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  const topFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0];
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];

  const dayStreak = getDayStreak(projects);

  const hasData = totalSessions > 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        <div className="h-32 rounded-2xl bg-stone-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-6">
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
                className="rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand text-xs"
              >
                Start generating →
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Total sessions", value: 0, icon: CalendarDays },
            { label: "Formats generated", value: 0, icon: Layers },
            { label: "Day streak", value: 0, icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
              <s.icon className="h-4 w-4 text-stone-300 mx-auto mb-1" />
              <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
              <p className="font-sans text-xs text-stone-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-6">
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

          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-stone-500">Generations used</span>
              <span className="font-sans text-sm font-semibold text-stone-900">{used}{isUnlimited ? "" : ` / ${limit}`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-stone-500">Sessions this month</span>
              <span className="font-sans text-sm font-semibold text-stone-900">{totalSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-stone-500">Plan</span>
              <span className="font-sans text-sm font-semibold text-stone-900 capitalize">{profile?.plan ?? "free"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total sessions", value: totalSessions, icon: CalendarDays },
          { label: "Formats generated", value: totalFormats, icon: Layers },
          { label: "Day streak", value: dayStreak, icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm text-center">
            <s.icon className="h-4 w-4 text-stone-400 mx-auto mb-1" />
            <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
            <p className="font-sans text-xs text-stone-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Last 7 days */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Last 7 days</p>
        <div className="flex items-end gap-2">
          {last7Days.map((day) => {
            const barH = Math.max((day.count / maxDayCount) * 48, 4);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="relative w-full flex items-end justify-center" style={{ height: 48 }}>
                  <div
                    className="w-full rounded-lg bg-primary transition-all duration-500"
                    style={{ height: barH, opacity: day.count > 0 ? 1 : 0.2 }}
                  />
                  {day.count > 0 && (
                    <span className="absolute -top-4 font-sans text-[10px] text-stone-500 font-medium">
                      {day.count}
                    </span>
                  )}
                </div>
                <span className="font-sans text-[10px] text-stone-400">{day.label}</span>
              </div>
            );
          })}
        </div>
        {totalSessions === 0 && (
          <p className="font-sans text-xs text-stone-400 text-center mt-3">
            Activity will appear here after your first generation
          </p>
        )}
      </div>

      {/* Top formats */}
      {formatCounts && Object.keys(formatCounts).length > 0 && (
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">Most used formats</p>
          <div className="space-y-2">
            {Object.entries(formatCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([format, count]) => {
                const icon = FORMAT_ICONS[format as ContentFormat] ?? "📝";
                const pct = Math.round((count / totalFormats) * 100);
                return (
                  <div key={format} className="flex items-center gap-3">
                    <span className="text-sm w-5 text-center">{icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-sans text-xs text-stone-700">{format}</span>
                        <span className="font-sans text-xs text-stone-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Fav input + format */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Fav input mode</p>
          {topSource ? (
            <p className="font-sans text-sm font-medium text-stone-800 capitalize">{topSource[0]} ({topSource[1]})</p>
          ) : (
            <p className="font-sans text-sm text-stone-400">No data yet</p>
          )}
        </div>
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Fav format</p>
          {topFormat ? (
            <p className="font-sans text-sm font-medium text-stone-800">{topFormat[0]} ({topFormat[1]})</p>
          ) : (
            <p className="font-sans text-sm text-stone-400">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
