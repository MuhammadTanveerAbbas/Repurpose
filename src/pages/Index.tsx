import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, ChevronDown, Check, X as XIcon, AlertTriangle, Play } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { FadeUp } from "@/components/FadeUp";
import { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell,
} from "recharts";

// --- Chart data ---
const contentGrowthData = [
  { month: "Jan", posts: 4 },
  { month: "Feb", posts: 9 },
  { month: "Mar", posts: 14 },
  { month: "Apr", posts: 22 },
  { month: "May", posts: 31 },
  { month: "Jun", posts: 47 },
  { month: "Jul", posts: 63 },
];

const formatBreakdownData = [
  { name: "LinkedIn", value: 34, color: "#E8743A" },
  { name: "Twitter", value: 26, color: "#D4632A" },
  { name: "Newsletter", value: 18, color: "#F59E0B" },
  { name: "YouTube Desc", value: 12, color: "#FBBF24" },
  { name: "Short-form", value: 10, color: "#FCD34D" },
];

const timeSavedData = [
  { label: "Manual writing", hours: 8, fill: "#D1C4B0" },
  { label: "With Repurpose AI", hours: 1.5, fill: "#E8743A" },
];

// Animated counter hook
function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const faqs = [
  {
    q: "How does the YouTube transcript extraction work?",
    a: "We fetch the auto-generated or manual captions directly from YouTube's caption API. If the video has no captions enabled, extraction will fail and you'll be prompted to paste the transcript manually.",
  },
  {
    q: "Can I upload audio or video files?",
    a: "You can upload files and they'll be stored, but automatic transcription from uploaded files is not yet implemented. For now, use YouTube URLs or paste your transcript directly  that's what works reliably today.",
  },
  {
    q: "Can I edit the generated content?",
    a: "Yes. Every output opens in a built-in editor where you can rewrite, change tone (professional, casual, punchy), and regenerate as many times as you need.",
  },
  {
    q: "How many projects can I create on the free plan?",
    a: "Free accounts get 3 projects per month with up to 3 output formats each. Paid plans remove those limits.",
  },
  {
    q: "Is the output actually in my voice?",
    a: "Not automatically. The AI generates content based on your transcript and the tone you select. It won't know your personal style, catchphrases, or audience context. Expect a solid first draft  not a finished post.",
  },
  {
    q: "Do you store my content?",
    a: "Yes. Your transcripts and generated outputs are stored in your account. You can delete any project at any time from your dashboard.",
  },
];

const comparisonFeatures = [
  { feature: "Projects per month", free: "3", creator: "Unlimited", pro: "Unlimited" },
  { feature: "Output formats", free: "3 per project", creator: "All 6", pro: "All 6" },
  { feature: "Tone control", free: "Professional only", creator: "3 tones", pro: "3 tones + custom" },
  { feature: "File uploads", free: "Storage only", creator: "Storage only", pro: "Storage only" },
  { feature: "YouTube transcripts", free: "✓", creator: "✓", pro: "✓" },
  { feature: "Paste transcript", free: "✓", creator: "✓", pro: "✓" },
  { feature: "Export options", free: "Copy to clipboard", creator: "TXT, Markdown", pro: "TXT, MD, Notion, Docs" },
  { feature: "Team members", free: "1", creator: "1", pro: "Up to 5" },
];

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Stats section animation trigger
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const postsCount = useCountUp(63, 1400, statsInView);
  const hoursCount = useCountUp(6, 1200, statsInView);
  const formatsCount = useCountUp(6, 1000, statsInView);

  // Chart section animation trigger
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-16 sm:py-24">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-4">
              Content repurposing, AI-assisted
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-stone-900 leading-tight tracking-tight mb-5 text-balance">
              One transcript becomes{" "}
              <span className="text-[#E8743A]">six content drafts</span>
            </h1>
            <p className="font-sans text-lg text-stone-500 leading-relaxed mb-8 max-w-lg">
              Paste a YouTube URL or your own transcript. Get a LinkedIn post, Twitter thread, newsletter section, and more  as a starting draft you edit and publish.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2 text-base h-12 px-6 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand hover:shadow-[0_6px_20px_rgba(232,116,58,0.4)] transition-all active:scale-[0.98]">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" size="lg" className="gap-2 text-base h-12 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl font-sans">
                  See pricing
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-stone-400 font-sans">
              <span>No credit card</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>3 free projects/mo</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>No billing yet</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-amber-100 to-stone-100 blur-2xl opacity-60 scale-105" />
              <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-elevated">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-300" />
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <div className="h-3 w-3 rounded-full bg-green-300" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
                    <p className="text-xs text-stone-400 mb-1 font-sans">YouTube URL</p>
                    <p className="text-sm font-mono text-stone-700 truncate">youtube.com/watch?v=dQw4w9WgXcQ</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["LinkedIn", "Twitter", "Newsletter"].map(t => (
                      <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-sans">{t}</span>
                    ))}
                  </div>
                  <div className="rounded-xl border border-stone-100 p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-sans">LinkedIn Draft</span>
                      <span className="text-[10px] text-stone-400 font-sans">needs your review</span>
                    </div>
                    <p className="text-sm leading-relaxed text-stone-700 font-sans">
                      I spent 6 months building something nobody asked for. Here's why it was the best decision of my career...
                    </p>
                    <div className="h-px bg-stone-100" />
                    <div className="flex items-center gap-2 text-xs text-stone-400 font-sans">
                      <Play className="h-3 w-3" /> AI draft  edit before posting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">Simple process</p>
            <h2 className="font-display text-3xl text-stone-900 mb-12">How it works</h2>
          </FadeUp>
          <div className="space-y-0">
            {[
              { num: "01", title: "Add your transcript", desc: "Paste a YouTube URL and we'll extract the captions, or paste your transcript directly. File upload stores the file but doesn't transcribe it yet." },
              { num: "02", title: "Pick your formats", desc: "Choose up to 6 platform-specific output formats  LinkedIn posts, Twitter threads, newsletters, YouTube descriptions, and short-form scripts." },
              { num: "03", title: "Edit & publish", desc: "The AI generates a first draft. You review it, edit it, change the tone, regenerate if needed, then copy or download. Don't skip the review step." },
            ].map((step, i) => (
              <FadeUp key={step.num} delay={i * 100}>
                <div className="flex gap-4 sm:gap-10 py-8 border-b border-dashed border-stone-200 last:border-b-0">
                  <span className="font-display text-4xl sm:text-5xl font-semibold text-stone-100 tabular-nums shrink-0 leading-none mt-1">{step.num}</span>
                  <div>
                    <h3 className="font-sans text-lg font-semibold text-stone-900 mb-1">{step.title}</h3>
                    <p className="font-sans text-sm text-stone-500 leading-relaxed max-w-md">{step.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1: Stats + Content Growth Chart */}
      <section className="bg-[#F8F5F0] border-t border-stone-200" ref={statsRef}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">By the numbers</p>
            <h2 className="font-display text-3xl text-stone-900 mb-3">Content output, compounded</h2>
            <p className="font-sans text-sm text-stone-500 mb-12 max-w-lg leading-relaxed">
              One transcript a week turns into a growing library of platform-ready drafts. Here's what that looks like over time.
            </p>
          </FadeUp>

          {/* Animated stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              { value: postsCount, suffix: "+", label: "Drafts from 1 transcript/week", sub: "after 7 months" },
              { value: hoursCount, suffix: "h", label: "Saved per transcript", sub: "vs. writing manually" },
              { value: formatsCount, suffix: "", label: "Output formats", sub: "per project" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="rounded-2xl bg-white border border-stone-100 p-5 shadow-sm text-center"
              >
                <p className="font-display text-3xl sm:text-4xl font-semibold text-[#E8743A] tabular-nums">
                  {stat.value}{stat.suffix}
                </p>
                <p className="font-sans text-sm font-semibold text-stone-800 mt-1">{stat.label}</p>
                <p className="font-sans text-xs text-stone-400 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Area chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-2xl bg-white border border-stone-100 p-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <p className="font-sans text-sm font-semibold text-stone-800">Cumulative content drafts</p>
                <p className="font-sans text-xs text-stone-400">1 transcript/week × 6 formats</p>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-sans self-start sm:self-auto">7-month projection</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={contentGrowthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8743A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#E8743A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E7E0D8", borderRadius: 12, fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                  labelStyle={{ color: "#57534E", fontWeight: 600 }}
                  itemStyle={{ color: "#E8743A" }}
                  formatter={(v: number) => [`${v} drafts`, "Total"]}
                />
                <Area
                  type="monotone"
                  dataKey="posts"
                  stroke="#E8743A"
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ r: 4, fill: "#E8743A", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#E8743A", strokeWidth: 0 }}
                  isAnimationActive={statsInView}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </section>

      {/* Real Talk */}
      <section className="bg-[#F8F5F0] border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <FadeUp>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-amber-600">Honest about what this is</p>
            </div>
            <h2 className="font-display text-3xl text-stone-900 mb-3">What it does  and what it doesn't</h2>
            <p className="font-sans text-stone-500 mb-12 max-w-xl leading-relaxed">
              No inflated claims. Here's exactly what you're getting.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <FadeUp delay={100}>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 h-full">
                <h3 className="font-display text-lg font-semibold mb-5 flex items-center gap-2 text-stone-900">
                  <Check className="h-5 w-5 text-amber-500" /> What it actually does
                </h3>
                <ul className="space-y-4">
                  {[
                    { title: "Extracts YouTube captions", desc: "Paste a YouTube URL and we pull the transcript automatically  if the video has captions. No captions, no transcript." },
                    { title: "Generates platform-specific drafts", desc: "LinkedIn posts respect long-form conventions. Tweets stay under 280 chars. Newsletter sections are scannable. The structure is right." },
                    { title: "Saves you the blank-page problem", desc: "You get a rough draft in seconds. It still needs your edits, your examples, your voice  but the skeleton is there." },
                    { title: "Lets you regenerate and adjust tone", desc: "Professional, casual, or punchy. Regenerate as many times as you want until the draft is closer to what you need." },
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans text-sm font-semibold text-stone-800">{item.title}</p>
                        <p className="font-sans text-xs text-stone-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={200}>
              <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 h-full">
                <h3 className="font-display text-lg font-semibold mb-5 flex items-center gap-2 text-stone-900">
                  <XIcon className="h-5 w-5 text-stone-400" /> What it doesn't do
                </h3>
                <ul className="space-y-4">
                  {[
                    { title: "Doesn't transcribe uploaded files", desc: "You can upload MP3/MP4 files and they'll be stored, but we don't transcribe them yet. Use YouTube URLs or paste text instead." },
                    { title: "Doesn't write in your voice", desc: "The AI doesn't know you. It generates generic-but-structured content. Your personality, examples, and opinions still need to come from you." },
                    { title: "Doesn't guarantee quality", desc: "Some outputs are great. Some are generic. Some will need significant rewriting. The regenerate button is there for a reason." },
                    { title: "Doesn't have real user reviews yet", desc: "This is an early-stage product. There are no verified testimonials or usage statistics to show you. We'd rather say that than make them up." },
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <XIcon className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans text-sm font-semibold text-stone-800">{item.title}</p>
                        <p className="font-sans text-xs text-stone-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Six formats */}
      <section className="bg-white border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
            <FadeUp>
              <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">Output formats</p>
              <h2 className="font-display text-3xl text-stone-900 mb-3">Six formats, one source</h2>
              <p className="font-sans text-sm text-stone-500 leading-relaxed">
                Each format has platform-specific prompts baked in  character limits, structure, and conventions. The AI follows them. Whether the output is good still depends on your transcript.
              </p>
            </FadeUp>
            <div className="space-y-0">
              {[
                { label: "LinkedIn long-form post", detail: "1,200–1,500 words with hook & CTA" },
                { label: "LinkedIn short hook post", detail: "Punchy 3-line opener format" },
                { label: "Twitter/X thread", detail: "7 tweets, each under 280 chars" },
                { label: "Email newsletter section", detail: "Scannable, link-friendly format" },
                { label: "YouTube description + tags", detail: "SEO-optimized with timestamps" },
                { label: "Short-form video scripts", detail: "3 × 60-second hooks" },
              ].map((f, i) => (
                <FadeUp key={f.label} delay={i * 60}>
                  <div className="flex items-center justify-between py-3 px-4 border-b border-stone-100 last:border-b-0 group hover:bg-stone-50 hover:shadow-sm rounded-xl transition-all cursor-default">
                    <span className="font-sans font-semibold text-sm text-stone-800">{f.label}</span>
                    <span className="font-sans text-xs text-stone-400 group-hover:text-stone-600 transition-colors">{f.detail}</span>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Time saved + Format breakdown charts */}
      <section className="bg-[#F8F5F0] border-t border-stone-200" ref={chartRef}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">Why it matters</p>
            <h2 className="font-display text-3xl text-stone-900 mb-3">Time saved. Formats covered.</h2>
            <p className="font-sans text-sm text-stone-500 mb-12 max-w-lg leading-relaxed">
              Writing one piece of content manually takes hours. Repurpose AI cuts that down to minutes, across every platform.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar chart: time comparison */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={chartInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl bg-white border border-stone-100 p-6 shadow-sm"
            >
              <p className="font-sans text-sm font-semibold text-stone-800 mb-1">Hours per transcript</p>
              <p className="font-sans text-xs text-stone-400 mb-6">Manual writing vs. AI-assisted</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeSavedData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E7E0D8", borderRadius: 12, fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                    labelStyle={{ color: "#57534E", fontWeight: 600 }}
                    formatter={(v: number) => [`${v}h`, "Time"]}
                    cursor={{ fill: "rgba(232,116,58,0.05)" }}
                  />
                  <Bar dataKey="hours" radius={[8, 8, 0, 0]} isAnimationActive={chartInView} animationDuration={1000} animationEasing="ease-out">
                    {timeSavedData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5">
                <span className="font-sans text-xs text-amber-700 font-medium">~6.5h saved per transcript on average</span>
              </div>
            </motion.div>

            {/* Radial bar chart: format distribution */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={chartInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl bg-white border border-stone-100 p-6 shadow-sm"
            >
              <p className="font-sans text-sm font-semibold text-stone-800 mb-1">Most-used output formats</p>
              <p className="font-sans text-xs text-stone-400 mb-4">% of total drafts generated</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto flex justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <RadialBarChart
                      cx="50%" cy="50%"
                      innerRadius={28} outerRadius={72}
                      data={formatBreakdownData}
                      startAngle={90} endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={4}
                        isAnimationActive={chartInView}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {formatBreakdownData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </RadialBar>
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #E7E0D8", borderRadius: 12, fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                        formatter={(v: number) => [`${v}%`, "Share"]}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 w-full sm:flex-1">
                  {formatBreakdownData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="font-sans text-xs text-stone-600">{item.name}</span>
                      </div>
                      <span className="font-sans text-xs font-semibold text-stone-700 tabular-nums">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="bg-[#F8F5F0] border-t border-stone-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
          <FadeUp>
            <h2 className="font-display text-3xl text-stone-900 mb-3 text-center">Compare plans</h2>
            <p className="font-sans text-stone-500 mb-10 text-center max-w-md mx-auto leading-relaxed">Payments aren't live yet  but here's what the plans will look like.</p>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="rounded-2xl border border-stone-100 overflow-x-auto shadow-sm bg-white">
              <table className="w-full min-w-[480px] text-sm font-sans">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="p-4 text-left font-semibold text-stone-700">Feature</th>
                    <th className="p-4 text-center font-semibold text-stone-500">Free</th>
                    <th className="p-4 text-center font-semibold bg-[#E8743A] text-white">Creator <span className="text-xs font-normal opacity-80">$49/mo</span></th>
                    <th className="p-4 text-center font-semibold text-stone-700">Pro <span className="text-xs font-normal text-stone-400">$99/mo</span></th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={row.feature} className={`${i % 2 === 0 ? "bg-white" : "bg-stone-50/60"} hover:bg-stone-50 transition-colors`}>
                      <td className="p-4 font-medium text-stone-700">{row.feature}</td>
                      <td className="p-4 text-center text-stone-400">{row.free}</td>
                      <td className="p-4 text-center text-stone-700 font-medium">{row.creator}</td>
                      <td className="p-4 text-center text-stone-700">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-5">
              <Link to="/pricing" className="font-sans text-sm font-medium text-amber-600 hover:underline inline-flex items-center gap-1">
                View full pricing <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-stone-200">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
          <FadeUp>
            <h2 className="font-display text-3xl text-stone-900 mb-10 text-center">Frequently asked questions</h2>
          </FadeUp>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-stone-200 last:border-b-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="font-sans font-semibold text-stone-900 text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pb-5"
                  >
                    <p className="font-sans text-sm text-stone-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-stone-900 px-6 sm:px-8 py-12 sm:py-16 text-center">
          <h2 className="font-display text-4xl text-white mb-3">Stop staring at a blank page</h2>
          <p className="font-sans text-stone-400 mb-8 leading-relaxed">You have the transcript. Get a draft in seconds  then make it yours.</p>
          <Link to="/signup">
            <Button size="lg" className="gap-2 h-12 px-8 text-base rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-sans font-semibold active:scale-[0.98] transition-all">
              Get started free <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-[#F8F5F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-14">
            <div className="col-span-2 md:col-span-1">
              <span className="font-display font-semibold text-stone-900 text-lg">Repurpose AI</span>
              <p className="font-sans text-sm text-stone-500 mt-3 leading-relaxed max-w-xs">
                Turn a transcript into six platform-ready drafts with AI. Early-stage  feedback welcome.
              </p>
            </div>
            <div>
              <h4 className="font-sans text-sm font-semibold text-stone-700 mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/pricing" className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors">Pricing</Link></li>
                <li><Link to="/templates" className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors">Templates</Link></li>
                <li><Link to="/dashboard" className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-sm font-semibold text-stone-700 mb-4">Account</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors">Login</Link></li>
                <li><Link to="/signup" className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-sm font-semibold text-stone-700 mb-4">Stack</h4>
              <ul className="space-y-2.5">
                <li><span className="font-sans text-sm text-stone-400">React + TypeScript</span></li>
                <li><span className="font-sans text-sm text-stone-400">Supabase</span></li>
                <li><span className="font-sans text-sm text-stone-400">Groq (Llama 3.3)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 font-sans">
            <p>© 2026 Repurpose AI. Early access  no payments active.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
