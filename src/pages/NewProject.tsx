import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Youtube, Upload, FileText, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const outputFormats = [
  { id: "linkedin_long", label: "LinkedIn Post (long-form)", desc: "1200-1500 word thought leadership" },
  { id: "linkedin_hook", label: "LinkedIn Post (short hook)", desc: "Punchy scroll-stopping opener" },
  { id: "email_newsletter", label: "Email Newsletter Section", desc: "Ready-to-send newsletter block" },
  { id: "twitter_thread", label: "Twitter/X Thread (7 tweets)", desc: "Under 280 chars each" },
  { id: "youtube_description", label: "YouTube Description + Tags", desc: "SEO-optimized description" },
  { id: "short_form_scripts", label: "Short-form Video Scripts", desc: "3 × 60-second hooks" },
];

const NewProject = () => {
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<"youtube" | "upload" | "paste">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pastedTranscript, setPastedTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const maxOutputs = profile?.plan === "free" ? 3 : 6;

  const toggleOutput = (id: string) => {
    setSelectedOutputs(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : prev.length < maxOutputs ? [...prev, id] : prev
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.size > 500 * 1024 * 1024) {
      toast.error("File must be under 500MB");
      return;
    }
    setFile(f ?? null);
    if (f) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const canContinueStep1 =
    (sourceType === "youtube" && youtubeUrl.trim().length > 0) ||
    (sourceType === "upload" && file !== null) ||
    (sourceType === "paste" && pastedTranscript.trim().length >= 50);

  const handleCreate = async () => {
    if (!user) return;
    if (selectedOutputs.length === 0) {
      toast.error("Select at least one output format");
      return;
    }
    setCreating(true);

    let fileUrl = null;
    if (sourceType === "upload" && file) {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("project-files").upload(path, file);
      if (error) {
        toast.error("Upload failed: " + error.message);
        setCreating(false);
        setUploading(false);
        return;
      }
      fileUrl = path;
      setUploading(false);
    }

    const { data, error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: title || "Untitled Project",
      source_type: sourceType === "paste" ? "paste" : sourceType,
      source_url: sourceType === "youtube" ? youtubeUrl : null,
      file_path: fileUrl,
      selected_outputs: selectedOutputs,
      transcript: sourceType === "paste" ? pastedTranscript.trim() : null,
      status: "processing",
      output_count: 0,
    }).select().single();

    if (error) {
      toast.error("Failed to create project");
      setCreating(false);
      return;
    }

    toast.success("Project created! Generating content...");
    supabase.functions.invoke("process-project", {
      body: { projectId: (data as any).id },
    }).then(({ error }) => {
      if (error) console.error("Process trigger failed:", error.message);
    }).catch(err => console.error("Process trigger failed:", err));

    navigate(`/project/${(data as any).id}`);
  };

  const inputClass = "h-11 rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans";

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Input", "Details", "Outputs"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors font-sans",
                i + 1 <= step
                  ? "bg-[#E8743A] text-white"
                  : "bg-stone-100 text-stone-400"
              )}>
                {i + 1}
              </div>
              <span className={cn("text-sm font-medium hidden sm:inline font-sans", i + 1 <= step ? "text-stone-900" : "text-stone-400")}>
                {label}
              </span>
              {i < 2 && <div className={cn("h-0.5 w-8 rounded-full", i + 1 < step ? "bg-[#E8743A]" : "bg-stone-200")} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6">
            <h2 className="font-display text-xl text-stone-900 mb-1">Add your content</h2>
            <p className="font-sans text-sm text-stone-400 mb-6">Paste a YouTube URL, upload a file, or paste a transcript directly</p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
              {[
                { type: "youtube" as const, icon: <Youtube className="h-5 w-5 sm:h-6 sm:w-6" />, label: "YouTube URL" },
                { type: "upload" as const, icon: <Upload className="h-5 w-5 sm:h-6 sm:w-6" />, label: "Upload File" },
                { type: "paste" as const, icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />, label: "Paste Text" },
              ].map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => setSourceType(type)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 sm:gap-2 rounded-xl border-2 p-3 sm:p-5 transition-all font-sans",
                    sourceType === type
                      ? "border-amber-400 bg-amber-50 text-amber-600"
                      : "border-stone-200 text-stone-400 hover:border-amber-300 hover:text-stone-600"
                  )}
                >
                  {icon}
                  <span className="font-semibold text-[11px] sm:text-xs text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>

            {sourceType === "youtube" && (
              <div className="space-y-2 mb-6">
                <Label className="font-sans text-sm font-medium text-stone-700">YouTube URL</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  className={inputClass}
                />
                <p className="font-sans text-xs text-stone-400">We'll try to auto-extract the transcript. If it fails, you can paste it manually.</p>
              </div>
            )}

            {sourceType === "upload" && (
              <div className="space-y-2 mb-6">
                <Label className="font-sans text-sm font-medium text-stone-700">Upload MP3 or MP4 (max 500MB)</Label>
                <Input type="file" accept=".mp3,.mp4,.m4a,.wav" onChange={handleFileChange} className={inputClass} />
                {file && <p className="font-sans text-sm text-stone-400">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
              </div>
            )}

            {sourceType === "paste" && (
              <div className="space-y-2 mb-6">
                <Label className="font-sans text-sm font-medium text-stone-700">Paste your transcript</Label>
                <Textarea
                  placeholder="Paste your video/podcast transcript here... (minimum 50 characters)"
                  value={pastedTranscript}
                  onChange={e => setPastedTranscript(e.target.value)}
                  className="min-h-[200px] text-sm rounded-xl border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-sans resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="font-sans text-xs text-stone-400">Tip: Copy the transcript from YouTube's "Show transcript" feature.</p>
                  <span className={cn("font-sans text-xs", pastedTranscript.trim().length >= 50 ? "text-stone-400" : "text-red-400")}>
                    {pastedTranscript.trim().length} chars
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6">
            <h2 className="font-display text-xl text-stone-900 mb-1">Project details</h2>
            <p className="font-sans text-sm text-stone-400 mb-6">Give your project a name</p>

            <div className="space-y-2 mb-6">
              <Label className="font-sans text-sm font-medium text-stone-700">Project Title</Label>
              <Input
                placeholder="e.g. My Latest Podcast Episode"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 font-sans"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                className="flex-1 gap-2 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
                disabled={!title}
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6">
            <h2 className="font-display text-xl text-stone-900 mb-1">Choose output formats</h2>
            <p className="font-sans text-sm text-stone-400 mb-6">
              Select up to {maxOutputs} formats.{" "}
              {profile?.plan === "free" && <span className="text-amber-600">Upgrade for all 6.</span>}
            </p>

            <div className="grid gap-3 mb-6">
              {outputFormats.map(format => {
                const selected = selectedOutputs.includes(format.id);
                const disabled = !selected && selectedOutputs.length >= maxOutputs;
                return (
                  <div
                    key={format.id}
                    onClick={() => !disabled && toggleOutput(format.id)}
                    role="checkbox"
                    aria-checked={selected}
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={e => e.key === " " && !disabled && toggleOutput(format.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border-2 p-4 transition-all text-left cursor-pointer select-none",
                      selected
                        ? "border-amber-400 bg-amber-50"
                        : "border-stone-200 hover:border-amber-300",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors",
                      selected ? "bg-amber-500 border-amber-500" : "border-stone-300 bg-white"
                    )}>
                      {selected && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-sm text-stone-800">{format.label}</p>
                      <p className="font-sans text-xs text-stone-400">{format.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 font-sans"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                className="flex-1 gap-2 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand transition-all active:scale-[0.98]"
                disabled={selectedOutputs.length === 0 || creating}
                onClick={handleCreate}
              >
                {creating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {uploading ? "Uploading..." : "Creating..."}</>
                  : "Generate Content"
                }
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewProject;
