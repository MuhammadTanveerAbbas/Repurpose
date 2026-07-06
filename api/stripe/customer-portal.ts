import { getStripe } from "../_lib/stripe";
import { verifyUser } from "../_lib/verify-auth";
import { getSupabaseAdmin } from "../_lib/supabase-admin";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const APP_URL = process.env.VITE_APP_URL ?? "http://localhost:8080";

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

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return response.status(400).json({ error: "No customer profile found" });
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/dashboard`,
    });

    return response.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error("Customer portal error:", error);
    return response.status(500).json({
      error: "Could not create portal session",
    });
  }
}
