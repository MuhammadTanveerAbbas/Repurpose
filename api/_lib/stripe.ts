import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return stripeInstance;
};
