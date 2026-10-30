import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  TrendingUp,
  CalendarDays,
  Layers,
  Flame,
  BarChart3,
  ArrowUpRight,
  Wand2,
  Youtube,
  FileText,
  Lightbulb,
  Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FORMAT_ICONS } from "@/lib/groq";
import type { ContentFormat } from "@/lib/groq";
import { getPlanLimit, isUnlimited as checkIsUnlimited } from "@/config/plans";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="h-3.5 w-3.5" />,
  transcript: <FileText className="h-3.5 w-3.5" />,
  idea: <Lightbulb className="h-3.5 w-3.5" />,
  pain_point: <Frown className="h-3.5 w-3.5" />,
  paste: <FileText className="h-3.5 w-3.5" />,
};

const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  transcript: "Transcript",
  idea: "Idea",
  pain_point: "Pain Point",
  paste: "Paste",
};

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
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().split("T")[0]!;
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-2xl bg-stone-100 animate-pulse", className)} />
);

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

  // ── Derived values ─────────────────────────────────────────────────────
  const limit = getPlanLimit(profile?.plan ?? "free");
  const used = profile?.projects_used_this_month ?? 0;
  const isUnlimited = checkIsUnlimited(limit);
  const usagePct = isUnlimited
    ? Math.min((used / Math.max(used, 50)) * 100, 100)
    : Math.min((used / Math.max(limit, 1)) * 100, 100);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthSessions = projects.filter(
    (p) => p.created_at?.startsWith(currentMonthStr),
  ).length;

  const totalSessions = projects.length;
  const totalFormats = projects.reduce((sum, p) => {
    const count =
      typeof p.output_count === "number"
        ? p.output_count
        : (p.selected_outputs?.length ?? 0);
    return sum + count;
  }, 0);

  const formatCounts: Record<string, number> = {};
  projects.forEach((p) => {
    (p.selected_outputs as string[] | null)?.forEach((f) => {
      formatCounts[f] = (formatCounts[f] ?? 0) + 1;
    });
  });

  const sourceCounts: Record<string, number> = {};
  projects.forEach((p) => {
    const src = p.source_type ?? "paste";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0]!;
    return {
      label: WEEKDAYS[d.getDay()]!,
      short: WEEKDAYS[d.getDay()]!.slice(0, 1),
      count: projects.filter((p) => p.created_at?.startsWith(dateStr)).length,
      date: dateStr,
      isToday: i === 6,
    };
  });
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  const topFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0];
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
  const dayStreak = getDayStreak(projects);
  const sortedFormats = Object.entries(formatCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-4">
        <Skeleton className="h-28" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-44" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (totalSessions === 0) {
    return (
      <div className="max-w-3xl mx-auto py-4 space-y-4">
        {/* Banner */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-sans font-semibold text-stone-800 mb-0.5">
              No stats yet
            </p>
            <p className="font-sans text-sm text-stone-500 mb-3">
              Generate your first piece of content and everything will track automatically.
            </p>
            <Link to="/dashboard">
              <Button
                size="sm"
                className="rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand text-xs"
              >
                Start generating
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Zero-state cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Generations", value: `0 / ${limit}`, icon: Wand2, sub: "this month" },
            { label: "Sessions", value: "0", icon: CalendarDays, sub: "all time" },
            { label: "Formats", value: "0", icon: Layers, sub: "generated" },
            { label: "Day streak", value: "0", icon: Flame, sub: "days" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center gap-1">
              <s.icon className="h-4 w-4 text-stone-300 mb-0.5" />
              <p className="font-display text-2xl font-semibold text-stone-300">{s.value}</p>
              <p className="font-sans text-xs font-semibold text-stone-400">{s.label}</p>
              <p className="font-sans text-[10px] text-stone-300">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Empty chart */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
              Last 7 days
            </p>
            <BarChart3 className="h-4 w-4 text-stone-200" />
          </div>
          <div className="flex items-end gap-2">
            {WEEKDAYS.slice(0, 7).map((label) => (
              <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full rounded-lg bg-stone-100" style={{ height: 48 }} />
                <span className="font-sans text-[10px] text-stone-300">{label.slice(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Full stats view ────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4">

      {/* ── Row 1: Usage banner ─────────────────────────────────────────── */}
      <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">
            This month
          </p>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60 capitalize">
            {profile?.plan ?? "free"} plan
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Donut ring */}
          <div className="relative shrink-0 h-[72px] w-[72px]">
            <svg className="h-[72px] w-[72px] -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#F5F0EB" strokeWidth="7" />
              <circle
                cx="36" cy="36" r="28" fill="none" stroke="#E8743A" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - usagePct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-lg font-semibold text-stone-900 leading-none">{used}</span>
              <span className="font-sans text-[9px] text-stone-400 leading-none mt-0.5">
                {isUnlimited ? "used" : `/ ${limit}`}
              </span>
            </div>
          </div>

          {/* Stats list */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 min-w-0">
            <div>
              <p className="font-sans text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Generations</p>
              <p className="font-sans text-sm font-semibold text-stone-900">
                {used}
                {!isUnlimited && <span className="text-stone-400 font-normal"> / {limit}</span>}
                {isUnlimited && <span className="text-stone-400 font-normal"> used</span>}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Sessions</p>
              <p className="font-sans text-sm font-semibold text-stone-900">{thisMonthSessions}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Formats out</p>
              <p className="font-sans text-sm font-semibold text-stone-900">
                {projects
                  .filter((p) => p.created_at?.startsWith(currentMonthStr))
                  .reduce((s, p) => s + (typeof p.output_count === "number" ? p.output_count : (p.selected_outputs?.length ?? 0)), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  usagePct >= 90 ? "bg-red-400" : usagePct >= 70 ? "bg-amber-400" : "bg-primary",
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-sans text-[10px] text-stone-400">{Math.round(usagePct)}% used</span>
              {usagePct >= 80 && (
                <Link to="/pricing" className="font-sans text-[10px] text-amber-600 font-semibold hover:underline">
                  Upgrade for more
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Row 2: 4 stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total sessions",
            value: totalSessions,
            sub: `${thisMonthSessions} this month`,
            icon: CalendarDays,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Formats generated",
            value: totalFormats,
            sub: `${Object.keys(formatCounts).length} unique`,
            icon: Layers,
            color: "text-violet-500",
            bg: "bg-violet-50",
          },
          {
            label: "Day streak",
            value: dayStreak,
            sub: dayStreak > 0 ? "keep it up" : "start today",
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "Input modes",
            value: Object.keys(sourceCounts).length,
            sub: topSource ? `${SOURCE_LABELS[topSource[0]] ?? topSource[0]} fav` : "used",
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2"
          >
            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 leading-none">
                {s.value}
              </p>
              <p className="font-sans text-xs font-semibold text-stone-500 mt-1">{s.label}</p>
              <p className="font-sans text-[10px] text-stone-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Activity chart ───────────────────────────────────────── */}
      <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-sans text-sm font-semibold text-stone-800">Activity</p>
            <p className="font-sans text-xs text-stone-400 mt-0.5">Last 7 days</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-sans">
            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
            sessions
          </div>
        </div>

        <div className="flex items-end gap-1.5 sm:gap-2">
          {last7Days.map((day) => {
            const pct = day.count / maxDayCount;
            const barH = Math.max(pct * 80, day.count > 0 ? 8 : 4);
            return (
              <div key={day.date} className="flex flex-col items-center gap-2 flex-1 group">
                {/* Count label */}
                <span
                  className={cn(
                    "font-sans text-[10px] font-semibold transition-opacity",
                    day.count > 0 ? "text-stone-500 opacity-100" : "opacity-0",
                  )}
                >
                  {day.count}
                </span>
                {/* Bar */}
                <div className="relative w-full flex items-end" style={{ height: 80 }}>
                  <div
                    className={cn(
                      "w-full rounded-lg transition-all duration-500",
                      day.isToday && day.count > 0
                        ? "bg-primary"
                        : day.count > 0
                          ? "bg-primary/70 group-hover:bg-primary"
                          : "bg-stone-100",
                    )}
                    style={{ height: barH }}
                  />
                  {/* Today marker */}
                  {day.isToday && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-sans text-[8px] font-semibold text-primary uppercase tracking-wide">
                      today
                    </span>
                  )}
                </div>
                {/* Day label */}
                <span
                  className={cn(
                    "font-sans text-[10px] mt-3",
                    day.isToday ? "font-semibold text-primary" : "text-stone-400",
                  )}
                >
                  {day.label.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 4: Formats + Sources side by side ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Most used formats */}
        <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <p className="font-sans text-sm font-semibold text-stone-800 mb-1">Top formats</p>
          <p className="font-sans text-xs text-stone-400 mb-4">By times selected</p>
          {sortedFormats.length === 0 ? (
            <p className="font-sans text-xs text-stone-300 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sortedFormats.map(([format, count], idx) => {
                const tag = FORMAT_ICONS[format as ContentFormat] ?? "—";
                const pct = totalFormats > 0 ? Math.round((count / totalFormats) * 100) : 0;
                const isTop = idx === 0;
                return (
                  <div key={format}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "font-sans text-[9px] font-bold w-8 text-center py-0.5 rounded shrink-0",
                            isTop
                              ? "bg-amber-100 text-amber-700"
                              : "bg-stone-100 text-stone-500",
                          )}
                        >
                          {tag}
                        </span>
                        <span className="font-sans text-xs text-stone-700 truncate">{format}</span>
                      </div>
                      <span className="font-sans text-xs text-stone-400 shrink-0 ml-2">
                        {count}x
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isTop ? "bg-primary" : "bg-stone-300",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input sources */}
        <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <p className="font-sans text-sm font-semibold text-stone-800 mb-1">Input sources</p>
          <p className="font-sans text-xs text-stone-400 mb-4">How you bring content in</p>
          {sortedSources.length === 0 ? (
            <p className="font-sans text-xs text-stone-300 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sortedSources.map(([src, count], idx) => {
                const pct = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
                const isTop = idx === 0;
                const label = SOURCE_LABELS[src] ?? src;
                return (
                  <div key={src}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-6 w-6 rounded-lg flex items-center justify-center shrink-0",
                            isTop ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-500",
                          )}
                        >
                          {SOURCE_ICONS[src] ?? <FileText className="h-3.5 w-3.5" />}
                        </span>
                        <span className="font-sans text-xs text-stone-700">{label}</span>
                      </div>
                      <span className="font-sans text-xs text-stone-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isTop ? "bg-primary" : "bg-stone-300",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5: Favourites summary ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Layers className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">
              Favourite format
            </p>
            {topFormat ? (
              <>
                <p className="font-sans text-sm font-semibold text-stone-800 truncate">
                  {topFormat[0]}
                </p>
                <p className="font-sans text-xs text-stone-400">
                  used {topFormat[1]} time{topFormat[1] !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <p className="font-sans text-sm text-stone-400">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CalendarDays className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">
              Favourite input
            </p>
            {topSource ? (
              <>
                <p className="font-sans text-sm font-semibold text-stone-800 capitalize">
                  {SOURCE_LABELS[topSource[0]] ?? topSource[0]}
                </p>
                <p className="font-sans text-xs text-stone-400">
                  {topSource[1]} session{topSource[1] !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <p className="font-sans text-sm text-stone-400">No data yet</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
