import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, ArrowRight, Zap, Users, Sparkles, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { FadeUp } from "@/components/FadeUp";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis,
} from "recharts";

// --- Data ---
const valueData = [
  { label: "Free", drafts: 9, color: "#D1C4B0" },
  { label: "Creator", drafts: 72, color: "#E8743A" },
  { label: "Pro", drafts: 72, color: "#D4632A" },
];

const radarData = [
  { feature: "Formats", free: 50, creator: 100, pro: 100 },
  { feature: "Projects", free: 30, creator: 100, pro: 100 },
  { feature: "Tones", free: 33, creator: 66, pro: 100 },
  { feature: "Exports", free: 20, creator: 60, pro: 100 },
  { feature: "Team", free: 20, creator: 20, pro: 100 },
];

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    desc: "Try it out, no card needed",
    badge: null,
    comingSoon: false,
    highlighted: false,
    icon: Zap,
    features: [
      { text: "3 projects per month", included: true },
      { text: "3 output formats per project", included: true },
      { text: "YouTube URL input", included: true },
      { text: "Paste transcript manually", included: true },
      { text: "Professional tone only", included: true },
      { text: "Copy to clipboard export", included: true },
      { text: "All 6 output formats", included: false },
      { text: "File uploads (MP3/MP4)", included: false },
      { text: "TXT & Markdown export", included: false },
      { text: "Team members", included: false },
    ],
    cta: "Get started free",
    ctaLink: "/signup",
  },
  {
    id: "creator",
    name: "Creator",
    price: "$49",
    period: "/mo",
    desc: "For serious content creators",
    badge: "Available soon",
    comingSoon: true,
    highlighted: true,
    icon: Sparkles,
    features: [
      { text: "Unlimited projects", included: true },
      { text: "All 6 output formats", included: true },
      { text: "YouTube URL input", included: true },
      { text: "Paste transcript manually", included: true },
      { text: "3 tones + regeneration", included: true },
      { text: "TXT & Markdown export", included: true },
      { text: "File uploads (MP3/MP4)", included: true },
      { text: "Priority processing", included: true },
      { text: "Custom tone instructions", included: false },
      { text: "Team members", included: false },
    ],
    cta: "Available soon",
    ctaLink: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    period: "/mo",
    desc: "For teams & power users",
    badge: null,
    comingSoon: true,
    highlighted: false,
    icon: Users,
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Up to 5 team members", included: true },
      { text: "Custom tone instructions", included: true },
      { text: "Saved tones per project", included: true },
      { text: "Notion & Google Docs export", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "API access (coming later)", included: true },
      { text: "White-label exports", included: false },
      { text: "Custom integrations", included: false },
    ],
    cta: "Coming soon",
    ctaLink: null,
  },
];

const faqs = [
  { q: "When do payments go live?", a: "Payments aren't active yet. You can sign up and use the free plan today. Paid plans will launch soon — we'll notify you." },
  { q: "What counts as a project?", a: "Each time you create a new transcript-based project, that counts as one. Regenerating outputs or editing content within a project doesn't count." },
  { q: "Can I switch plans later?", a: "Yes. You'll be able to upgrade or downgrade at any time once billing is live. Downgrades take effect at the end of your billing cycle." },
  { q: "What happens if I hit the free limit?", a: "You'll be blocked from creating new projects until the next month resets, or until you upgrade. Existing projects stay accessible." },
  { q: "Is there a trial for paid plans?", a: "We're considering a 7-day trial for Creator. Nothing confirmed yet — follow along for updates." },
];

const Pricing = () => {
  const { profile } = useAuth();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">Pricing</p>
          <h1 className="font-display text-4xl sm:text-5xl text-stone-900 mb-4 leading-tight">
            Simple, honest pricing
          </h1>
          <p className="font-sans text-stone-500 leading-relaxed max-w-md mx-auto">
            Start free. Upgrade when you need more. No hidden fees, no surprise charges.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-sans text-xs text-amber-700 font-medium">Payments not live yet — free access for everyone now</span>
          </div>
        </motion.div>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrentPlan = profile?.plan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative rounded-2xl border flex flex-col overflow-hidden",
                  plan.highlighted
                    ? "bg-[#E8743A] border-[#E8743A] shadow-brand lg:scale-[1.03]"
                    : plan.comingSoon
                    ? "bg-white border-stone-200 opacity-80"
                    : "bg-white border-stone-100 shadow-sm"
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className={cn(
                      "font-sans text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1",
                      plan.highlighted
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 text-stone-500"
                    )}>
                      {plan.comingSoon && <Lock className="h-2.5 w-2.5" />}
                      {plan.badge}
                    </span>
                  </div>
                )}
                {!plan.badge && plan.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-widest bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Coming soon
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + name */}
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-4",
                    plan.highlighted ? "bg-white/20" : "bg-amber-50"
                  )}>
                    <Icon className={cn("h-4 w-4", plan.highlighted ? "text-white" : "text-amber-600")} />
                  </div>

                  <p className={cn("font-display text-lg font-semibold mb-0.5", plan.highlighted ? "text-white" : "text-stone-900")}>
                    {plan.name}
                  </p>
                  <p className={cn("font-sans text-xs mb-5", plan.highlighted ? "text-white/70" : "text-stone-400")}>
                    {plan.desc}
                  </p>

                  {/* Price */}
                  <div className="mb-6 flex items-end gap-1">
                    <span className={cn("font-display text-4xl font-semibold leading-none", plan.highlighted ? "text-white" : "text-stone-900")}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={cn("font-sans text-sm mb-0.5", plan.highlighted ? "text-white/60" : "text-stone-400")}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5 font-sans text-sm">
                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5",
                          !f.included ? "opacity-20" : plan.highlighted ? "text-white" : "text-amber-500"
                        )} />
                        <span className={cn(
                          !f.included ? "line-through opacity-30" : "",
                          plan.highlighted ? "text-white/90" : "text-stone-600"
                        )}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.comingSoon ? (
                    <Button
                      disabled
                      size="sm"
                      className="w-full rounded-xl font-sans font-semibold bg-stone-100 text-stone-400 cursor-not-allowed hover:bg-stone-100"
                    >
                      <Lock className="h-3.5 w-3.5 mr-1.5" /> Coming soon
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn("w-full rounded-xl font-sans font-semibold",
                        plan.highlighted ? "border-white/30 text-white bg-white/10 hover:bg-white/20" : "border-stone-200 text-stone-500"
                      )}
                      disabled
                    >
                      Current plan
                    </Button>
                  ) : (
                    <Link to={plan.ctaLink!}>
                      <Button
                        size="sm"
                        className={cn(
                          "w-full rounded-xl font-sans font-semibold gap-1.5 transition-all active:scale-[0.98]",
                          plan.highlighted
                            ? "bg-white text-[#E8743A] hover:bg-stone-100"
                            : "bg-[#E8743A] hover:bg-[#D4632A] text-white shadow-brand"
                        )}
                      >
                        {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Animated charts section */}
      <section className="bg-white border-t border-stone-200" ref={chartRef}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
          <FadeUp>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">Value at a glance</p>
            <h2 className="font-display text-3xl text-stone-900 mb-3">See what you get</h2>
            <p className="font-sans text-sm text-stone-500 mb-12 max-w-lg leading-relaxed">
              A quick visual breakdown of drafts per month and feature coverage across plans.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar chart: drafts per month */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={chartInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl bg-[#F8F5F0] border border-stone-100 p-6"
            >
              <p className="font-sans text-sm font-semibold text-stone-800 mb-1">Max drafts per month</p>
              <p className="font-sans text-xs text-stone-400 mb-6">Projects × formats per plan</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={valueData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={44}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E7E0D8", borderRadius: 12, fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                    labelStyle={{ color: "#57534E", fontWeight: 600 }}
                    formatter={(v: number) => [`${v} drafts`, "Max/month"]}
                    cursor={{ fill: "rgba(232,116,58,0.05)" }}
                  />
                  <Bar dataKey="drafts" radius={[8, 8, 0, 0]} isAnimationActive={chartInView} animationDuration={1000} animationEasing="ease-out">
                    {valueData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="font-sans text-xs text-stone-400 mt-3 text-center">Free: 3 projects × 3 formats = 9 &nbsp;|&nbsp; Paid: unlimited × 6</p>
            </motion.div>

            {/* Radar chart: feature coverage */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={chartInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl bg-[#F8F5F0] border border-stone-100 p-6"
            >
              <p className="font-sans text-sm font-semibold text-stone-800 mb-1">Feature coverage by plan</p>
              <p className="font-sans text-xs text-stone-400 mb-4">Relative score across key dimensions</p>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                  <PolarGrid stroke="#E7E0D8" />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11, fill: "#A8A29E", fontFamily: "Plus Jakarta Sans" }} />
                  <Radar name="Free" dataKey="free" stroke="#D1C4B0" fill="#D1C4B0" fillOpacity={0.25}
                    isAnimationActive={chartInView} animationDuration={1000} />
                  <Radar name="Creator" dataKey="creator" stroke="#E8743A" fill="#E8743A" fillOpacity={0.3}
                    isAnimationActive={chartInView} animationDuration={1200} />
                  <Radar name="Pro" dataKey="pro" stroke="#D4632A" fill="#D4632A" fillOpacity={0.15}
                    isAnimationActive={chartInView} animationDuration={1400} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E7E0D8", borderRadius: 12, fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-2">
                {[{ label: "Free", color: "#D1C4B0" }, { label: "Creator", color: "#E8743A" }, { label: "Pro", color: "#D4632A" }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="font-sans text-xs text-stone-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F8F5F0] border-t border-stone-200">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-20">
          <FadeUp>
            <h2 className="font-display text-3xl text-stone-900 mb-10 text-center">Questions</h2>
          </FadeUp>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 60}>
                <div className="border-b border-stone-200 last:border-b-0 py-5">
                  <p className="font-sans font-semibold text-stone-900 text-sm mb-1.5">{faq.q}</p>
                  <p className="font-sans text-sm text-stone-500 leading-relaxed">{faq.a}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <FadeUp>
          <div className="mx-auto max-w-3xl rounded-3xl bg-stone-900 px-6 sm:px-8 py-12 sm:py-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-3">Start with free, upgrade anytime</h2>
            <p className="font-sans text-stone-400 mb-8 leading-relaxed">No card required. 3 projects a month, on us.</p>
            <Link to="/signup">
              <Button size="lg" className="gap-2 h-12 px-8 text-base rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-sans font-semibold active:scale-[0.98] transition-all">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </FadeUp>
      </section>
    </div>
  );
};

export default Pricing;
