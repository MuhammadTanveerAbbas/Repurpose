const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<import("@stripe/stripe-js").Stripe | null> | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js");
    if (STRIPE_PUBLISHABLE_KEY) {
      stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
  }
  return stripePromise;
};
