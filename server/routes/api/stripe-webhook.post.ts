import Stripe from "stripe";
import { defineEventHandler, readRawBody } from "vinxi/http";
import { createSupabaseAdmin } from "../../utils/supabase-admin";

/**
 * POST /api/stripe-webhook
 *
 * Receives Stripe webhook events and updates user tiers in Supabase.
 *
 * Handled events:
 * - checkout.session.completed → upgrade user to premium
 * - customer.subscription.deleted → downgrade user to free
 */
export default defineEventHandler(async (event) => {
  const env = (event.context as any).cloudflare?.env ?? process.env;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error("[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Webhook not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  // Read the raw body for signature verification
  const rawBody = await readRawBody(event);
  const signature =
    event.headers?.get?.("stripe-signature") ??
    (event.node?.req?.headers?.["stripe-signature"] as string);

  if (!rawBody || !signature) {
    return new Response("Missing body or signature", { status: 400 });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
    });
  }

  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.warn("[stripe-webhook] checkout.session.completed missing supabase_user_id metadata");
          break;
        }

        console.log(`[stripe-webhook] Upgrading user ${userId} to premium`);
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ tier: "premium" })
          .eq("id", userId);

        if (error) {
          console.error("[stripe-webhook] Failed to update profile:", error.message);
          return new Response("Database update failed", { status: 500 });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.warn("[stripe-webhook] customer.subscription.deleted missing supabase_user_id metadata");
          break;
        }

        console.log(`[stripe-webhook] Downgrading user ${userId} to free`);
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ tier: "free" })
          .eq("id", userId);

        if (error) {
          console.error("[stripe-webhook] Failed to downgrade profile:", error.message);
          return new Response("Database update failed", { status: 500 });
        }

        break;
      }

      default:
        // Ignore other event types
        break;
    }
  } catch (err: any) {
    console.error("[stripe-webhook] Error processing event:", err.message);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
