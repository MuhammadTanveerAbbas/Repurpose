import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, RefreshCw, Download, Loader2, Check, Save, AlertCircle, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formatLabels: Record<string, string> = {
  linkedin_long: "LinkedIn (Long)",
  linkedin_hook: "LinkedIn (Hook)",
  email_newsletter: "Email Newsletter",
  twitter_thread: "Twitter/X Thread",
  youtube_description: "YouTube Description",
  short_form_scripts: "Short-form Scripts",
};

const formatTips: Record<string, string> = {
  linkedin_long: "Best for thought leadership. Aim for 1,200-1,500 words with a strong hook.",
  linkedin_hook: "Punchy 3-line opener that stops the scroll. Keep under 700 characters.",
  twitter_thread: "7 tweets, each under 280 chars. First tweet is the hook.",
  email_newsletter: "Scannable format with bullet points. Include a subject line.",
  youtube_description: "SEO-optimized with timestamps and tags for discoverability.",
  short_form_scripts: "3 × 60-second hooks for TikTok, Reels, or Shorts.",
};

const charLimits: Record<string, number> = {
  linkedin_long: 3000,
  linkedin_hook: 700,
  twitter_thread: 1960,
  youtube_description: 5000,
};

type ProjectData = {
  id: string;
  title: string;
  source_type: string;
  selected_outputs: string[];
  status: string;
  transcript: string | null;
};

type Output = {
  id: string;
  format_type: string;
  content: string;
  tone: string;
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");
  const [submittingTranscript, setSubmittingTranscript] = useState(false);

  // Use a ref for activeTab so fetchData doesn't re-create on tab change
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const fetchData = async (isPolling = false) => {
    if (!id || !user) return;

    const [{ data: proj }, { data: outs }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).eq("user_id", user.id).single(),
      supabase.from("project_outputs").select("*").eq("project_id", id),
    ]);

    if (proj) setProject(proj as ProjectData);
    const outputList = (outs as Output[]) ?? [];
    setOutputs(outputList);

    // Set first tab only on initial load, not on polls
    if (!isPolling && outputList.length > 0 && !activeTabRef.current) {
      setActiveTab(outputList[0].format_type);
    }
    // On poll: if outputs arrived and no tab selected yet, pick first
    if (isPolling && outputList.length > 0 && !activeTabRef.current) {
      setActiveTab(outputList[0].format_type);
    }

    setLoading(false);
    return proj;
  };

  // Initial load
  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Polling — only while processing
  useEffect(() => {
    if (!project) return;
    if (project.status !== "processing") return;

    const interval = setInterval(async () => {
      const proj = await fetchData(true);
      // Stop polling once no longer processing
      if (proj && proj.status !== "processing") {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status]);

  const activeOutput = outputs.find(o => o.format_type === activeTab);

  const handleCopy = async () => {
    if (!activeOutput) return;
    await navigator.clipboard.writeText(activeOutput.content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!activeOutput) return;
    setSaving(true);
    const { error } = await supabase
      .from("project_outputs")
      .update({ content: activeOutput.content })
      .eq("id", activeOutput.id);
    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Saved!");
      setDirty(false);
    }
    setSaving(false);
  };

  const handleRegenerate = async (tone?: string) => {
    if (!activeOutput || !project) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          projectId: project.id,
          formatType: activeOutput.format_type,
          transcript: project.transcript,
          tone: tone || activeOutput.tone,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const newContent = data?.content ?? "";
      if (!newContent) throw new Error("Empty response from AI");
      setOutputs(prev =>
        prev.map(o =>
          o.format_type === activeTab ? { ...o, content: newContent, tone: tone || o.tone } : o
        )
      );
      setDirty(false);
      toast.success("Content regenerated!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate. Try again.");
    }
    setRegenerating(false);
  };

  const handleContentEdit = (value: string) => {
    setOutputs(prev =>
      prev.map(o => (o.format_type === activeTab ? { ...o, content: value } : o))
    );
    setDirty(true);
  };

  const handleDownloadAll = () => {
    const content = outputs
      .map(o => `=== ${formatLabels[o.format_type] || o.format_type} ===\n\n${o.content}`)
      .join("\n\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.title || "project"}-outputs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const content = outputs
      .map(o => `# ${formatLabels[o.format_type] || o.format_type}\n\n${o.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.title || "project"}-outputs.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    supabase
      .from("projects")
      .update({ status: "processing" })
      .eq("id", project!.id)
      .then(() => {
        setProject(prev => prev ? { ...prev, status: "processing" } : null);
        supabase.functions.invoke("process-project", { body: { projectId: project!.id } });
      });
  };

  const handleSubmitManualTranscript = async () => {
    if (!project || manualTranscript.trim().length < 50) return;
    setSubmittingTranscript(true);
    const { error } = await supabase
      .from("projects")
      .update({ transcript: manualTranscript.trim(), status: "processing" })
      .eq("id", project.id);
    if (error) {
      toast.error("Failed to save transcript");
      setSubmittingTranscript(false);
      return;
    }
    setProject(prev => prev ? { ...prev, status: "processing", transcript: manualTranscript.trim() } : null);
    supabase.functions.invoke("process-project", { body: { projectId: project.id } });
    setSubmittingTranscript(false);
    setShowManualInput(false);
    setManualTranscript("");
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="font-sans text-stone-400">Project not found</p>
        </div>
      </div>
    );
  }

  const charLimit = charLimits[activeTab];
  const charCount = activeOutput?.content?.length ?? 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F8F5F0]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl text-stone-900 truncate">{project.title}</h1>
              <p className="font-sans text-sm text-stone-400 capitalize flex items-center gap-2 mt-0.5">
                {project.source_type} · {project.status}
                {project.status === "error" && (
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" /> failed
                  </span>
                )}
              </p>
            </div>
            {outputs.length > 0 && (
              <div className="flex gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-sans" onClick={handleDownloadMarkdown}>
                      <Download className="h-4 w-4" /> <span className="hidden sm:inline">.md</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download all as Markdown</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-sans" onClick={handleDownloadAll}>
                      <Download className="h-4 w-4" /> <span className="hidden sm:inline">.txt</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download all as plain text</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* ── Processing ── */}
          {project.status === "processing" && (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm">
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                <div className="text-center">
                  <h3 className="font-display text-lg text-stone-900 mb-1">Generating your content…</h3>
                  <p className="font-sans text-sm text-stone-400">Usually takes 30–90 seconds. Hang tight.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {project.status === "error" && (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm">
              <div className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto px-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <h3 className="font-display text-lg text-stone-900 mb-2">Generation failed</h3>
                <p className="font-sans text-stone-400 text-sm mb-6 leading-relaxed">
                  {project.source_type === "youtube"
                    ? "Couldn't extract captions from that YouTube video — it may have captions disabled or restricted. Paste the transcript manually to continue."
                    : "Something went wrong during generation. Paste your transcript below to retry."}
                </p>

                {!showManualInput ? (
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-sans"
                      onClick={handleRetry}
                    >
                      <RefreshCw className="h-4 w-4" /> Retry
                    </Button>
                    <Button
                      className="gap-2 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand"
                      onClick={() => setShowManualInput(true)}
                    >
                      <ClipboardPaste className="h-4 w-4" /> Paste transcript
                    </Button>
                  </div>
                ) : (
                  <div className="w-full space-y-3 text-left">
                    <Textarea
                      placeholder="Paste your transcript here… (minimum 50 characters)"
                      value={manualTranscript}
                      onChange={e => setManualTranscript(e.target.value)}
                      className="min-h-[200px] text-sm rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs text-stone-400">On YouTube: click "…" → "Show transcript" → copy all</span>
                      <span className={cn("font-sans text-xs", manualTranscript.trim().length >= 50 ? "text-stone-400" : "text-red-400")}>
                        {manualTranscript.trim().length} chars
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-stone-600 hover:bg-stone-50 font-sans"
                        onClick={() => { setShowManualInput(false); setManualTranscript(""); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 gap-2 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand"
                        disabled={manualTranscript.trim().length < 50 || submittingTranscript}
                        onClick={handleSubmitManualTranscript}
                      >
                        {submittingTranscript && <Loader2 className="h-4 w-4 animate-spin" />}
                        Generate content
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Completed with outputs ── */}
          {project.status === "completed" && outputs.length > 0 && (
            <div className="grid grid-cols-1 -cols-[200px_1fr] gap-5">
              {/* Format tabs */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:overflow-visible">
                {(project.selected_outputs ?? []).map(fmt => (
                  <Tooltip key={fmt}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { setActiveTab(fmt); setDirty(false); }}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm font-medium text-left whitespace-nowrap transition-all font-sans shrink-0 lg:shrink",
                          activeTab === fmt
                            ? "bg-white shadow-sm text-stone-900 border border-stone-100 font-semibold"
                            : "bg-stone-100/60 hover:bg-white hover:shadow-sm text-stone-500 hover:text-stone-800"
                        )}
                      >
                        {formatLabels[fmt] || fmt}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      {formatTips[fmt] || "Click to view this output"}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Editor */}
              <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-5 sm:p-6">
                {activeOutput ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="min-w-0">
                        <h2 className="font-display text-lg text-stone-900">{formatLabels[activeTab]}</h2>
                        <p className="font-sans text-xs text-stone-400 mt-0.5">{formatTips[activeTab]}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        oltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select
                                value={activeOutput.tone || "professional"}
                                onValueChange={tone => handleRegenerate(tone)}
                              >
                                <SelectTrigger className="w-32 sm:w-36 h-9 rounded-xl border-stone-200 font-sans text-sm text-stone-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-stone-200">
                                  <SelectItem value="professional">Professional</SelectItem>
    m value="casual">Casual</SelectItem>
                                  <SelectItem value="punchy">Punchy</SelectItem>
                                </SelectContent>
                              </Select>
          </div>
          )}

        </main>
      </div>
    </TooltipProvider>
  );
};

export default ProjectDetail;
 flex items-center justify-center py-16">
              <div className="text-center">
                <p className="font-sans text-stone-400 text-sm mb-3">No outputs found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl border-stone-200 font-sans"
                  onClick={() => fetchData(false)}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
              </div>
  
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <p className="font-sans text-stone-400 text-sm">Select a format on the left</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Completed but no outputs yet (race condition) ── */}
          {project.status === "completed" && outputs.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm  />

                    <div className="flex items-center justify-between text-xs text-stone-400 font-sans">
                      <span>{activeOutput.content.split(/\s+/).filter(Boolean).length} words</span>
                      {charLimit && (
                        <span className={charCount > charLimit ? "text-red-400 font-medium" : ""}>
                          {charCount} / {charLimit} chars
                        </span>
                      )}
                    </div>
                  </div>lipboard</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <Textarea
                      value={activeOutput.content}
                      onChange={e => handleContentEdit(e.target.value)}
                      className="min-h-[300px] sm:min-h-[420px] font-sans text-sm text-stone-800 leading-relaxed resize-y rounded-xl border-stone-200 bg-stone-50/50 focus:ring-1 focus:ring-amber-200/60 focus:border-amber-300"
                  -200 text-stone-600 hover:bg-stone-50 font-sans"
                              onClick={handleCopy}
                            >
                              {copied
                                ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                                : <Copy className="h-3.5 w-3.5" />}
                              {copied ? "Copied" : "Copy"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy to cassName="hidden sm:inline">Save</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Save edits</TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline" size="sm"
                              className="gap-1.5 rounded-xl border-stonet="outline" size="sm"
                                className="gap-1.5 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-sans"
                                onClick={handleSave}
                                disabled={saving}
                              >
                                {saving
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Save className="h-3.5 w-3.5" />}
                                <span clCw className="h-3.5 w-3.5" />}
                              <span className="hidden sm:inline">Regenerate</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Regenerate with same tone</TooltipContent>
                        </Tooltip>

                        {dirty && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                varian         <Button
                              variant="outline" size="sm"
                              className="gap-1.5 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-sans"
                              onClick={() => handleRegenerate()}
                              disabled={regenerating}
                            >
                              {regenerating
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Refresh                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Change tone and regenerate</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                   