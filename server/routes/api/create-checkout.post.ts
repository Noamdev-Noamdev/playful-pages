import Stripe from "stripe";
import { defineEventHandler, readBody } from "vinxi/http";

/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout Session for a Premium subscription.
 * Expects JSON body: { userId: string, userEmail: string }
 * Returns JSON: { url: string } — the Stripe Checkout URL to redirect to.
 */
export default defineEventHandler(async (event) => {
  const env = (event.context as any).cloudflare?.env ?? process.env;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const priceId = env.STRIPE_PRICE_ID;

  if (!stripeSecretKey || !priceId) {
    return new Response(
      JSON.stringify({ error: "Stripe is not configured on the server" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await readBody(event);
  const { userId, userEmail } = body ?? {};

  if (!userId || !userEmail) {
    return new Response(
      JSON.stringify({ error: "Missing userId or userEmail" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  // Determine the origin for success/cancel URLs
  const origin =
    event.headers?.get?.("origin") ??
    (event.node?.req?.headers?.origin as string) ??
    "https://playpile.org";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-checkout] Stripe error:", err.message);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
