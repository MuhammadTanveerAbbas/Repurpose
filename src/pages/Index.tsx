import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Check,
  Lightbulb,
  FileText,
  Link as LinkIcon,
  Frown,
  Sparkles,
  Copy,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { FadeUp } from "@/components/FadeUp";
import { useState } from "react";

const faqs = [
  {
    q: "What input modes does it support?",
    a: "Four modes: a raw Idea (topic or one-liner), a pasted Transcript, a YouTube URL (we fetch the transcript automatically), or a Pain Point / rant. The AI figures out the best content strategy for whatever you give it.",
  },
  {
    q: "How does the AI strategy step work?",
    a: "Before generating anything, the tool analyzes your input and returns a Content Strategy Card — core message, target audience, recommended tone, and the best 3–5 formats for that specific input. You can edit the plan before hitting generate.",
  },
  {
    q: "What content formats can it generate?",
    a: "LinkedIn Post, LinkedIn Hook, Twitter/X Thread, Short-form Video Script, Cold Email Draft, Newsletter Section, YouTube Description, Instagram Caption, and Personal Brand Bio. You pick which ones to generate.",
  },
  {
    q: "Can I edit the generated content?",
    a: "Yes. Every output is an editable textarea. You can rewrite inline, regenerate just that format, or mark it as done once you've posted it.",
  },
  {
    q: "How many generations do I get on the free plan?",
    a: "Free accounts get 5 generations per month. Creator ($49/mo) and Pro ($99/mo) plans are unlimited. Pro also unlocks History and Export.",
  },
  {
    q: "Does it write in my voice?",
    a: "Not automatically. The AI doesn't know your personal style. It generates a strong, platform-appropriate first draft. Your voice, examples, and opinions still need to come from you.",
  },
  {
    q: "Is my content stored?",
    a: "Yes. Each generation session is saved to your account. Pro users can browse full history and re-open past sessions. You can delete any project at any time.",
  },
];

const formats = [
  {
    icon: "💼",
    label: "LinkedIn Post",
    detail: "150–300 words, hook + insight + CTA",
  },
  {
    icon: "🪝",
    label: "LinkedIn Hook",
    detail: "3-line scroll-stopper opener",
  },
  {
    icon: "🐦",
    label: "Twitter/X Thread",
    detail: "6–8 tweets, each under 280 chars",
  },
  {
    icon: "🎬",
    label: "Short-form Video Script",
    detail: "Under 60s, hook + body + CTA",
  },
  {
    icon: "📧",
    label: "Cold Email Draft",
    detail: "Subject + 4-line body, zero fluff",
  },
  {
    icon: "📰",
    label: "Newsletter Section",
    detail: "Intro + 3 key points + CTA",
  },
  {
    icon: "▶️",
    label: "YouTube Description",
    detail: "SEO-optimized with timestamps",
  },
  {
    icon: "📸",
    label: "Instagram Caption",
    detail: "Hook + paragraphs + hashtags",
  },
  {
    icon: "👤",
    label: "Personal Brand Bio",
    detail: "Third-person, 3 sentences",
  },
];

const comparisonFeatures = [
  {
    feature: "Generations per month",
    free: "5",
    creator: "Unlimited",
    pro: "Unlimited",
  },
  { feature: "Input modes", free: "All 4", creator: "All 4", pro: "All 4" },
  { feature: "Output formats", free: "All 9", creator: "All 9", pro: "All 9" },
  { feature: "AI strategy analysis", free: "✓", creator: "✓", pro: "✓" },
  { feature: "Inline editing + regenerate", free: "✓", creator: "✓", pro: "✓" },
  { feature: "Copy All / Export .md", free: "✓", creator: "✓", pro: "✓" },
  { feature: "Project history", free: "—", creator: "—", pro: "✓" },
  { feature: "YouTube transcript fetch", free: "✓", creator: "✓", pro: "✓" },
];

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-4">
              Smart Content Engine
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-stone-900 leading-tight tracking-tight mb-5 text-balance">
              Give it anything.{" "}
              <span className="text-[#E8743A]">Get content worth posting.</span>
            </h1>
            <p className="font-sans text-lg text-stone-500 leading-relaxed mb-8 max-w-lg">
              Drop in a rough idea, a transcript, a YouTube URL, or a pain
              point. The AI figures out the strategy, picks the right formats,
              and generates content that's actually ready to post.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="gap-2 text-base h-12 px-6 rounded-xl bg-[#E8743A] hover:bg-[#D4632A] text-white font-sans font-semibold shadow-brand hover:shadow-[0_6px_20px_rgba(232,116,58,0.4)] transition-all active:scale-[0.98]"
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  variant="ghost"
                  size="lg"
                  className="gap-2 text-base h-12 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl font-sans"
                >
                  See pricing
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-stone-400 font-sans">
              <span>No credit card</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>5 free generations/mo</span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span>9 output formats</span>
            </div>
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
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
                    <p className="text-xs text-stone-400 mb-1 font-sans">
                      💡 Idea
                    </p>
                    <p className="text-sm text-stone-700 font-sans">
                      "I charge $5k for MVP builds and people still lowball me"
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 font-sans">
                      🧠 Content Strategy
                    </p>
                    <p className="text-xs text-stone-600 font-sans mb-1">
                      <span className="font-semibold">Audience:</span>{" "}
                      Non-technical founders
                    </p>
                    <p className="text-xs text-stone-600 font-sans mb-3">
                      <span className="font-semibold">Tone:</span> Provocative
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        "💼 LinkedIn Post",
                        "🐦 Twitter Thread",
                        "🎬 Video Script",
                      ].map((f) => (
                        <span
                          key={f}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8743A] text-white font-sans"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-stone-100 p-4 bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-sans mb-2">
                      💼 LinkedIn Post
                    </p>
                    <p className="text-sm leading-relaxed text-stone-700 font-sans">
                      I turned down a $2k project last week. Here's why that was
                      the right call...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">
              Simple process
            </p>
            <h2 className="font-display text-3xl text-stone-900 mb-12">
              How it works
            </h2>
          </FadeUp>
          <div className="space-y-0">
            {[
              {
                num: "01",
                title: "Give it anything",
                desc: "A rough idea, a pasted transcript, a YouTube URL, or a pain point. The tool accepts all four. No formatting required.",
              },
              {
                num: "02",
                title: "Review the strategy",
                desc: "Before generating, the AI analyzes your input and shows you a Content Strategy Card — core message, audience, tone, and recommended formats. Edit it or just hit go.",
              },
              {
                num: "03",
                title: "Get content worth posting",
                desc: "Each selected format is generated with platform-specific rules baked in. Edit inline, regenerate individually, copy, or export as Markdown. Done.",
              },
            ].map((step, i) => (
              <FadeUp key={step.num} delay={i * 100}>
                <div className="flex gap-4 sm:gap-10 py-8 border-b border-dashed border-stone-200 last:border-b-0">
                  <span className="font-display text-4xl sm:text-5xl font-semibold text-stone-100 tabular-nums shrink-0 leading-none mt-1">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-sans text-lg font-semibold text-stone-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="font-sans text-sm text-stone-500 leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Input modes */}
      <section className="bg-[#F8F5F0] border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">
              Input modes
            </p>
            <h2 className="font-display text-3xl text-stone-900 mb-3">
              Start from wherever you are
            </h2>
            <p className="font-sans text-sm text-stone-500 mb-12 max-w-lg leading-relaxed">
              You don't need a polished transcript. Give it whatever you have.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
                label: "Idea",
                desc: "A topic, thought, or one-liner. The tool builds content from scratch.",
                example:
                  '"I charge $5k for MVP builds and people still lowball me"',
              },
              {
                icon: <FileText className="h-5 w-5 text-amber-500" />,
                label: "Transcript",
                desc: "Paste raw transcript text. The tool repurposes it intelligently.",
                example: "Paste any raw transcript — podcast, talk, interview",
              },
              {
                icon: <LinkIcon className="h-5 w-5 text-amber-500" />,
                label: "YouTube URL",
                desc: "Drop in a YouTube link. We fetch the transcript automatically.",
                example: "youtube.com/watch?v=...",
              },
              {
                icon: <Frown className="h-5 w-5 text-amber-500" />,
                label: "Pain Point",
                desc: "A problem statement or rant. The tool turns it into authority content.",
                example:
                  '"Clients expect unlimited revisions for a fixed price"',
              },
            ].map((mode, i) => (
              <FadeUp key={mode.label} delay={i * 80}>
                <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {mode.icon}
                    <span className="font-sans font-semibold text-stone-800">
                      {mode.label}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-stone-500 mb-3 leading-relaxed">
                    {mode.desc}
                  </p>
                  <p className="font-sans text-xs text-stone-400 italic">
                    {mode.example}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* 9 formats */}
      <section className="bg-white border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
            <FadeUp>
              <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">
                Output formats
              </p>
              <h2 className="font-display text-3xl text-stone-900 mb-3">
                9 formats, one input
              </h2>
              <p className="font-sans text-sm text-stone-500 leading-relaxed mb-4">
                Each format has platform-specific prompts baked in — character
                limits, structure, tone conventions. The AI follows them. You
                pick which ones to generate.
              </p>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="font-sans text-xs text-amber-700">
                  The AI recommends the best 3–5 formats for your specific input
                </p>
              </div>
            </FadeUp>
            <div className="space-y-0">
              {formats.map((f, i) => (
                <FadeUp key={f.label} delay={i * 50}>
                  <div className="flex items-center justify-between py-3 px-4 border-b border-stone-100 last:border-b-0 group hover:bg-stone-50 rounded-xl transition-all cursor-default">
                    <span className="font-sans font-semibold text-sm text-stone-800 flex items-center gap-2">
                      <span>{f.icon}</span> {f.label}
                    </span>
                    <span className="font-sans text-xs text-stone-400 group-hover:text-stone-600 transition-colors">
                      {f.detail}
                    </span>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-[#F8F5F0] border-t border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">
              Output experience
            </p>
            <h2 className="font-display text-3xl text-stone-900 mb-3">
              Every output, fully in your control
            </h2>
            <p className="font-sans text-sm text-stone-500 mb-12 max-w-lg leading-relaxed">
              No locked outputs. No copy-paste walls. Everything is editable,
              regeneratable, and exportable.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Check className="h-5 w-5 text-amber-500" />,
                title: "Edit inline",
                desc: "Every output is a live textarea. Rewrite directly in the app.",
              },
              {
                icon: <Copy className="h-5 w-5 text-amber-500" />,
                title: "Copy or export",
                desc: "One-click copy per card, Copy All, or Export as Markdown.",
              },
              {
                icon: <Download className="h-5 w-5 text-amber-500" />,
                title: "Regenerate any format",
                desc: "Not happy with one output? Regenerate it without touching the others.",
              },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 80}>
                <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
                  <div className="mb-3">{item.icon}</div>
                  <p className="font-sans font-semibold text-stone-800 mb-1">
                    {item.title}
                  </p>
                  <p className="font-sans text-sm text-stone-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="bg-white border-t border-stone-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
          <FadeUp>
            <h2 className="font-display text-3xl text-stone-900 mb-3 text-center">
              Compare plans
            </h2>
            <p className="font-sans text-stone-500 mb-10 text-center max-w-md mx-auto leading-relaxed">
              Payments aren't live yet — but here's what the plans will look
              like.
            </p>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="rounded-2xl border border-stone-100 overflow-x-auto shadow-sm bg-white">
              <table className="w-full min-w-[480px] text-sm font-sans">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="p-4 text-left font-semibold text-stone-700">
                      Feature
                    </th>
                    <th className="p-4 text-center font-semibold text-stone-500">
                      Free
                    </th>
                    <th className="p-4 text-center font-semibold bg-[#E8743A] text-white">
                      Creator{" "}
                      <span className="text-xs font-normal opacity-80">
                        $49/mo
                      </span>
                    </th>
                    <th className="p-4 text-center font-semibold text-stone-700">
                      Pro{" "}
                      <span className="text-xs font-normal text-stone-400">
                        $99/mo
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-stone-50/60"} hover:bg-stone-50 transition-colors`}
                    >
                      <td className="p-4 font-medium text-stone-700">
                        {row.feature}
                      </td>
                      <td className="p-4 text-center text-stone-400">
                        {row.free}
                      </td>
                      <td className="p-4 text-center text-stone-700 font-medium">
                        {row.creator}
                      </td>
                      <td className="p-4 text-center text-stone-700">
                        {row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-5">
              <Link
                to="/pricing"
                className="font-sans text-sm font-medium text-amber-600 hover:underline inline-flex items-center gap-1"
              >
                View full pricing <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#F8F5F0] border-t border-stone-200">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
          <FadeUp>
            <h2 className="font-display text-3xl text-stone-900 mb-10 text-center">
              Frequently asked questions
            </h2>
          </FadeUp>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b border-stone-200 last:border-b-0"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="font-sans font-semibold text-stone-900 text-sm pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pb-5"
                  >
                    <p className="font-sans text-sm text-stone-500 leading-relaxed">
                      {faq.a}
                    </p>
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
          <h2 className="font-display text-4xl text-white mb-3">
            Stop staring at a blank page
          </h2>
          <p className="font-sans text-stone-400 mb-8 leading-relaxed">
            Give it a rough idea. Get content worth posting. Takes 30 seconds.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="gap-2 h-12 px-8 text-base rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-sans font-semibold active:scale-[0.98] transition-all"
            >
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
              <span className="font-display font-semibold text-stone-900 text-lg">
                Repurpose AI
              </span>
              <p className="font-sans text-sm text-stone-500 mt-3 leading-relaxed max-w-xs">
                Smart Content Engine for solo founders and creators. Give it
                anything — get content worth posting.
              </p>
            </div>
            <div>
              <h4 className="font-sans text-sm font-semibold text-stone-700 mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to="/pricing"
                    className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-sm font-semibold text-stone-700 mb-4">
                Account
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to="/login"
                    className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="font-sans text-sm text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-sm font-semibold text-stone-700 mb-4">
                Stack
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <span className="font-sans text-sm text-stone-400">
                    React + TypeScript
                  </span>
                </li>
                <li>
                  <span className="font-sans text-sm text-stone-400">
                    Supabase
                  </span>
                </li>
                <li>
                  <span className="font-sans text-sm text-stone-400">
                    Groq (Llama 3.3)
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 font-sans">
            <p>© 2026 Repurpose AI. Early access — no payments active.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
