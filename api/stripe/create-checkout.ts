import { getStripe } from "../_lib/stripe";
import { verifyUser } from "../_lib/verify-auth";
import { getSupabaseAdmin } from "../_lib/supabase-admin";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const APP_URL = process.env.VITE_APP_URL ?? "http://localhost:8080";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  creator: process.env.STRIPE_PRICE_CREATOR,
  pro: process.env.STRIPE_PRICE_PRO,
};

const checkoutSchema = z.object({
  planId: z.enum(["creator", "pro"]),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const user = await verifyUser(request.headers.authorization);
  if (!user) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const parsed = checkoutSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid request" });
  }

  const { planId, successUrl, cancelUrl } = parsed.data;

  const priceId = PLAN_PRICE_MAP[planId];
  if (!priceId) {
    return response.status(400).json({ error: "Invalid plan" });
  }

  const safeSuccessUrl = typeof successUrl === "string" ? successUrl : `${APP_URL}/dashboard`;
  const safeCancelUrl = typeof cancelUrl === "string" ? cancelUrl : `${APP_URL}/pricing`;

  if (!safeSuccessUrl.startsWith(APP_URL) || !safeCancelUrl.startsWith(APP_URL)) {
    return response.status(400).json({ error: "Invalid redirect URL" });
  }

  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      success_url: `${safeSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: safeCancelUrl,
      allow_promotion_codes: true,
    });

    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return response.status(500).json({
      error: "Could not create checkout session",
    });
  }
}
