export type PlanId = "free" | "creator" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  generatonsPerMonth: number;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    generatonsPerMonth: 5,
    features: [
      "5 generations per month",
      "All 4 input modes",
      "All 9 output formats",
      "AI strategy analysis",
      "Inline editing + regenerate",
      "Copy All + Export .md",
    ],
  },
  creator: {
    id: "creator",
    name: "Creator",
    price: 4900,
    generatonsPerMonth: 9999,
    features: [
      "Unlimited generations",
      "All 4 input modes",
      "All 9 output formats",
      "AI strategy analysis",
      "Inline editing + regenerate",
      "Copy All + Export .md",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9900,
    generatonsPerMonth: 9999,
    features: [
      "Everything in Creator",
      "Full project history",
      "Re-open past sessions",
      "Priority support",
      "Notion & Google Docs export",
      "API access",
    ],
  },
};

export const getPlanLimit = (planId: string): number => {
  const plan = PLANS[planId as PlanId];
  return plan?.generatonsPerMonth ?? 5;
};

export const isUnlimited = (limit: number): boolean => limit >= 9999;
