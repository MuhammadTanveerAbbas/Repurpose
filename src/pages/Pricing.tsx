import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { lazy, Suspense, useState } from "react";
import {
  Check,
  ArrowRight,
  Zap,
  Users,
  Sparkles,
  Clock,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { FadeUp } from "@/components/FadeUp";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanId } from "@/config/plans";

const PricingCharts = lazy(() =>
  import("@/components/PricingCharts").then((m) => ({ default: m.PricingCharts })),
);

const plans = [
  {
    id: "free" as PlanId,
    name: "Free",
    price: "$0",
    period: "",
    desc: "Try it out, no card needed",
    badge: null,
    comingSoon: false,
    highlighted: false,
    icon: Zap,
    features: [
      { text: "5 generations per month", included: true },
      { text: "All 4 input modes", included: true },
      { text: "All 9 output formats", included: true },
      { text: "AI strategy analysis", included: true },
      { text: "Inline editing + regenerate", included: true },
      { text: "Copy All + Export .md", included: true },
      { text: "Project history", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get started free",
  },
  {
    id: "creator" as PlanId,
    name: "Creator",
    price: "$49",
    period: "/mo",
    desc: "For serious content creators",
    badge: "Available soon",
    comingSoon: true,
    highlighted: true,
    icon: Sparkles,
    features: [
      { text: "Unlimited generations", included: true },
      { text: "All 4 input modes", included: true },
      { text: "All 9 output formats", included: true },
      { text: "AI strategy analysis", included: true },
      { text: "Inline editing + regenerate", included: true },
      { text: "Copy All + Export .md", included: true },
      { text: "Project history", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Subscribe",
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    price: "$99",
    period: "/mo",
    desc: "For power users",
    badge: null,
    comingSoon: true,
    highlighted: false,
    icon: Users,
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Full project history", included: true },
      { text: "Re-open past sessions", included: true },
      { text: "Markdown export (.md)", included: true },
      { text: "Notion & Google Docs export", included: false },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Subscribe",
  },
];

const faqs = [
  {
    q: "When do payments go live?",
    a: "Payments aren't active yet. You can sign up and use the free plan today. Paid plans will launch soon we'll notify you.",
  },
  {
    q: "What counts as a generation?",
    a: "Each time you run the full generate flow (strategy analysis + content generation), that counts as one generation. Regenerating individual formats or editing content doesn't count.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You'll be able to upgrade or downgrade at any time once billing is live. Downgrades take effect at the end of your billing cycle.",
  },
  {
    q: "What happens if I hit the free limit?",
    a: "You'll see a soft upgrade prompt and won't be able to start a new generation until the next month resets or you upgrade. All your existing outputs stay accessible.",
  },
  {
    q: "Is there a trial for paid plans?",
    a: "We're considering a 7-day trial for Creator. Nothing confirmed yet follow along for updates.",
  },
];

const Pricing = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (!user) {
      navigate("/signup");
      return;
    }

    setCheckoutLoading(planId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          successUrl: window.location.origin + "/dashboard",
          cancelUrl: window.location.origin + "/pricing",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Checkout failed");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed. Try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-sans text-xs font-semibold tracking-[0.15em] text-amber-600 uppercase mb-3">
            Pricing
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-stone-900 mb-4 leading-tight">
            Simple, honest pricing
          </h1>
          <p className="font-sans text-stone-500 leading-relaxed max-w-md mx-auto">
            Start free. Upgrade when you need more. No hidden fees, no surprise
            charges.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-sans text-xs text-amber-700 font-medium">
              Payments not live yet free access for everyone now
            </span>
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
                    ? "bg-primary border-primary shadow-brand lg:scale-[1.03]"
                    : plan.comingSoon
                      ? "bg-white border-stone-200 opacity-80"
                      : "bg-white border-stone-100 shadow-sm",
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span
                      className={cn(
                        "font-sans text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1",
                        plan.highlighted
                          ? "bg-white/20 text-white"
                          : "bg-stone-100 text-stone-500",
                      )}
                    >
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
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center mb-4",
                      plan.highlighted ? "bg-white/20" : "bg-amber-50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        plan.highlighted ? "text-white" : "text-amber-600",
                      )}
                    />
                  </div>

                  <p
                    className={cn(
                      "font-display text-lg font-semibold mb-0.5",
                      plan.highlighted ? "text-white" : "text-stone-900",
                    )}
                  >
                    {plan.name}
                  </p>
                  <p
                    className={cn(
                      "font-sans text-xs mb-5",
                      plan.highlighted ? "text-white/70" : "text-stone-400",
                    )}
                  >
                    {plan.desc}
                  </p>

                  {/* Price */}
                  <div className="mb-6 flex items-end gap-1">
                    <span
                      className={cn(
                        "font-display text-4xl font-semibold leading-none",
                        plan.highlighted ? "text-white" : "text-stone-900",
                      )}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={cn(
                          "font-sans text-sm mb-0.5",
                          plan.highlighted ? "text-white/60" : "text-stone-400",
                        )}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li
                        key={f.text}
                        className="flex items-start gap-2.5 font-sans text-sm"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            !f.included
                              ? "opacity-20"
                              : plan.highlighted
                                ? "text-white"
                                : "text-amber-500",
                          )}
                        />
                        <span
                          className={cn(
                            !f.included ? "line-through opacity-30" : "",
                            plan.highlighted
                              ? "text-white/90"
                              : "text-stone-600",
                          )}
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrentPlan && !plan.comingSoon ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "w-full rounded-xl font-sans font-semibold",
                        plan.highlighted
                          ? "border-white/30 text-white bg-white/10 hover:bg-white/20"
                          : "border-stone-200 text-stone-500",
                      )}
                      disabled
                    >
                      Current plan
                    </Button>
                  ) : plan.comingSoon ? (
                    <Button
                      disabled
                      size="sm"
                      className="w-full rounded-xl font-sans font-semibold bg-stone-100 text-stone-400 cursor-not-allowed hover:bg-stone-100"
                    >
                      <Lock className="h-3.5 w-3.5 mr-1.5" /> Coming soon
                    </Button>
                  ) : plan.id === "free" ? (
                    <Link to={user ? "/dashboard" : "/signup"}>
                      <Button
                        size="sm"
                        className="w-full rounded-xl font-sans font-semibold bg-primary hover:bg-primary/90 text-white shadow-brand transition-all active:scale-[0.98]"
                      >
                        {user ? "Go to dashboard" : plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutLoading === plan.id}
                      className={cn(
                        "w-full rounded-xl font-sans font-semibold gap-1.5 transition-all active:scale-[0.98]",
                        plan.highlighted
                          ? "bg-white text-primary hover:bg-stone-100"
                          : "bg-primary hover:bg-primary/90 text-white shadow-brand",
                      )}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…
                        </>
                      ) : (
                        <>
                          {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Suspense
        fallback={
          <section className="bg-white border-t border-stone-200">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
                <div className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
              </div>
            </div>
          </section>
        }
      >
        <PricingCharts />
      </Suspense>

      {/* FAQ */}
      <section className="bg-background border-t border-stone-200">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-20">
          <FadeUp>
            <h2 className="font-display text-3xl text-stone-900 mb-10 text-center">
              Questions
            </h2>
          </FadeUp>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 60}>
                <div className="border-b border-stone-200 last:border-b-0 py-5">
                  <p className="font-sans font-semibold text-stone-900 text-sm mb-1.5">
                    {faq.q}
                  </p>
                  <p className="font-sans text-sm text-stone-500 leading-relaxed">
                    {faq.a}
                  </p>
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
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-3">
              Start with free, upgrade anytime
            </h2>
            <p className="font-sans text-stone-400 mb-8 leading-relaxed">
              No card required. 5 free generations a month, on us.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="gap-2 h-12 px-8 text-base rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-sans font-semibold active:scale-[0.98] transition-all"
              >
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
