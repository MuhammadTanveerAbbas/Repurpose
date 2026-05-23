import { getStripe } from "../_lib/stripe";
import { getSupabaseAdmin } from "../_lib/supabase-admin";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const sig = request.headers["stripe-signature"] as string | undefined;

  if (!sig || !WEBHOOK_SECRET) {
    return response.status(400).json({ error: "Missing signature or webhook secret" });
  }

  let event: import("stripe").Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return response.status(400).json({ error: "Invalid signature" });
  }

  try {
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const userId = session.metadata?.user_id ?? session.client_reference_id;

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: session.customer as string,
              plan: "creator",
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as import("stripe").Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price.id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const plan = priceId === process.env.STRIPE_PRICE_PRO ? "pro" : "creator";

          await supabase
            .from("profiles")
            .update({
              plan: status === "active" || status === "trialing" ? plan : "free",
            })
            .eq("id", profile.id);

          await supabase
            .from("subscriptions")
            .upsert({
              user_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              status,
              plan_id: plan,
              current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : null,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, { onConflict: "stripe_subscription_id" });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as import("stripe").Stripe.Subscription;
        const deletedCustomerId = deletedSub.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", deletedCustomerId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", profile.id);

          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              plan_id: "free",
            })
            .eq("stripe_subscription_id", deletedSub.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice;
        const subId = invoice.subscription as string;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await supabase
            .from("subscriptions")
            .update({
              current_period_start: sub.current_period_start
                ? new Date(sub.current_period_start * 1000).toISOString()
                : null,
              current_period_end: sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
              status: sub.status,
            })
            .eq("stripe_subscription_id", subId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as import("stripe").Stripe.Invoice;
        const failedCustomerId = failedInvoice.customer as string;

        console.error("Payment failed for customer:", failedCustomerId);
        break;
      }
    }

    return response.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return response.status(200).json({ received: true });
  }
}
