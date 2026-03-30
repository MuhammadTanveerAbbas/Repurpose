import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FadeUp } from "@/components/FadeUp";
import { Plus, FileText, ArrowUpRight, Youtube, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  created_at: string;
  source_type: string;
  output_count: number;
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setProjects((data as Project[]) ?? []);
      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  const planLimits: Record<string, number> = { free: 3, creator: 999, pro: 999 };
  const limit = planLimits[profile?.plan ?? "free"] ?? 3;
  const used = profile?.projects_used_this_month ?? 0;
  const totalOutputs = projects.reduce((s, p) => s + (p.output_count || 0), 0);
  const thisMonth = projects.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length;

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Header */}
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-stone-900">
                {profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "Dashboard"}
              </h1>
              <p className="font-sans text-sm text-stone-400 mt-0.5">
                {totalOutputs} pieces created · {thisMonth} project{thisMonth !== 1 ? "s" : ""} this month
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5 h-9 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98] self-start sm:self-auto"
              onClick={() => navigate("/project/new")}
            >
              <Plus className="h-3.5 w-3.5" /> New project
            </Button>
          </div>
        </FadeUp>

        {/* Stats row */}
        <FadeUp delay={50}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "This month", value: thisMonth, icon: <FileText className="h-5 w-5 text-amber-400" /> },
              { label: "Total pieces", value: totalOutputs, icon: <ArrowUpRight className="h-5 w-5 text-amber-400" /> },
              { label: "Projects total", value: projects.length, icon: <Youtube className="h-5 w-5 text-amber-400" /> },
              { label: "Plan", value: profile?.plan ?? "free", icon: <Upload className="h-5 w-5 text-amber-400" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-stone-400 uppercase tracking-wide">{stat.label}</span>
                  {stat.icon}
                </div>
                <p className="font-display text-3xl text-stone-900 capitalize">{stat.value}</p>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Usage  free plan only */}
        {profile?.plan === "free" && (
          <FadeUp delay={100}>
            <div className="rounded-2xl border border-stone-100 bg-white p-5 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-sm font-medium text-stone-700">Free plan · {used}/{limit} projects used</span>
                <Link to="/pricing" className="font-sans text-xs font-medium text-amber-600 hover:underline">Upgrade</Link>
              </div>
              <Progress value={(used / limit) * 100} className="h-1.5" />
            </div>
          </FadeUp>
        )}

        {/* Projects */}
        <FadeUp delay={150}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-semibold text-stone-900 text-lg">
              Your projects
              {projects.length > 0 && (
                <span className="ml-2 font-sans text-xs font-medium bg-stone-100 text-stone-500 rounded-full px-2 py-0.5">{projects.length}</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="font-display text-xl text-stone-700 mb-1">No projects yet</h3>
              <p className="font-sans text-sm text-stone-400 mb-6 max-w-xs leading-relaxed">
                Paste a YouTube URL or upload audio to create your first content pieces.
              </p>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all"
                onClick={() => navigate("/project/new")}
              >
                <Plus className="h-3.5 w-3.5" /> Create first project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <FadeUp key={project.id} delay={i * 50}>
                  <Link
                    to={`/project/${project.id}`}
                    className="block bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        project.source_type === "youtube" ? "bg-amber-50 text-amber-500" : "bg-stone-100 text-stone-500"
                      )}>
                        {project.source_type === "youtube"
                          ? <Youtube className="h-5 w-5" />
                          : <Upload className="h-5 w-5" />
                        }
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="font-sans font-semibold text-stone-900 text-sm truncate mb-1">{project.title}</p>
                    <p className="font-sans text-xs text-stone-400">
                      {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {project.output_count} output{project.output_count !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <span className="font-sans text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 capitalize">{project.source_type}</span>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          )}
        </FadeUp>
      </main>
    </div>
  );
};

export default Dashboard;
