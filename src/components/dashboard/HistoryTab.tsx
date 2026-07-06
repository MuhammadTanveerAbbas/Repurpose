import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FORMAT_ICONS } from "@/lib/groq";
import type {
  ContentFormat,
} from "@/lib/groq";
import { Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "sonner";

const INPUT_MODE_ICONS: Record<string, string> = {
  idea: "💡",
  transcript: "📋",
  youtube: "🔗",
  pain_point: "😤",
};

export const HistoryTab = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, source_type, created_at, transcript, selected_outputs, status",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    const { error } = await supabase.from("projects").delete().eq("id", deleteTargetId);
    if (error) {
      toast.error("Failed to delete project.");
    } else {
      toast.success("Project deleted.");
      queryClient.invalidateQueries({ queryKey: ["history", user?.id] });
    }
    setDeleting(false);
    setDeleteTargetId(null);
  };

  const isPro = profile?.plan === "pro";

  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="font-display text-lg text-stone-800 mb-2">
            History is a Pro feature
          </h3>
          <p className="font-sans text-sm text-stone-500 mb-4">
            Upgrade to Pro ($99/mo) to save and revisit all your past
            generations.
          </p>
          <Button
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-sans font-semibold shadow-brand"
            onClick={() => (window.location.href = "/pricing")}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-stone-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="font-display text-lg text-stone-800 mb-1">
            No history yet
          </h3>
          <p className="font-sans text-sm text-stone-500">
            Generate your first piece of content and it'll show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {projects.map((project) => {
        const isExpanded = expandedId === project.id;
        const modeIcon = INPUT_MODE_ICONS[project.source_type] ?? "📄";
        const formats = (project.selected_outputs ?? []) as ContentFormat[];

        return (
          <div
            key={project.id}
            className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4">
              <span className="text-lg shrink-0">{modeIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-stone-800 truncate">
                  {project.title}
                </p>
                <p className="font-sans text-xs text-stone-400">
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  {formats.length} format{formats.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTargetId(project.id)}
                  className="h-9 w-9 p-0 rounded-lg text-stone-300 hover:text-red-400"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-stone-100 p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {formats.map((f) => (
                    <span
                      key={f}
                      className="font-sans text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600"
                    >
                      {FORMAT_ICONS[f]} {f}
                    </span>
                  ))}
                </div>
                {project.transcript && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <p className="font-sans text-xs text-stone-400 mb-1 uppercase tracking-wider font-semibold">
                      Original Input
                    </p>
                    <p className="font-sans text-xs text-stone-600 line-clamp-3">
                      {project.transcript}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete this project?"
        description="This will permanently remove the project from your history."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
