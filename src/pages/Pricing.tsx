import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Try it out",
    features: ["3 projects/month", "3 output formats", "YouTube URL input", "Basic tones"],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Creator",
    price: "$49",
    period: "/mo",
    desc: "For serious creators",
    features: ["Unlimited projects", "All 6 output formats", "File uploads (MP3/MP4)", "Download exports", "All tones & regeneration", "Priority processing"],
    cta: "Upgrade",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mo",
    desc: "For teams",
    features: ["Everything in Creator", "2 team seats", "Priority regeneration", "Custom tone instructions", "Saved tones per project", "Priority support"],
    cta: "Upgrade",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">Pricing</p>
          <h1 className="font-display text-4xl text-stone-900 mb-2">Simple, honest pricing</h1>
          <p className="font-sans text-stone-500 leading-relaxed">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl p-6 flex flex-col border shadow-sm",
                plan.highlighted
                  ? "bg-[#E8743A] border-[#E8743A] text-white shadow-brand sm:scale-[1.02]"
                  : "bg-white border-stone-100"
              )}
            >
              {plan.highlighted && (
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-white/80 mb-3">Most popular</span>
              )}
              <p className={cn("font-display text-sm font-semibold mb-1", plan.highlighted ? "text-white" : "text-stone-900")}>{plan.name}</p>
              <p className={cn("font-sans text-xs mb-4", plan.highlighted ? "text-white/70" : "text-stone-400")}>{plan.desc}</p>
              <div className="mb-6">
                <span className={cn("font-display text-3xl font-semibold", plan.highlighted ? "text-white" : "text-stone-900")}>{plan.price}</span>
                <span className={cn("font-sans text-sm", plan.highlighted ? "text-white/70" : "text-stone-400")}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 font-sans text-sm">
                    <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.highlighted ? "text-white/80" : "text-amber-500")} />
                    <span className={plan.highlighted ? "text-white/90" : "text-stone-600"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className={cn(
                  "w-full rounded-xl font-sans font-semibold transition-all active:scale-[0.98]",
                  plan.highlighted
                    ? "bg-white text-[#E8743A] hover:bg-stone-100"
                    : "bg-[#E8743A] hover:bg-[#D4632A] text-white shadow-brand"
                )}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
