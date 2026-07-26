import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import Stripe from "stripe";

function getEnv(request: any, context?: any): Record<string, string | undefined> {
  return {
    ...((globalThis as any).process?.env ?? {}),
    ...(context?.cloudflare?.env ?? {}),
    ...(request?.env ?? {}),
  };
}

export const Route = createFileRoute("/api/create-checkout")({
  server: {
    handlers: {
      POST: async ({ request, context }: { request: Request; context?: any }) => {
        const env = getEnv(request, context);

        const stripeSecretKey = env.STRIPE_SECRET_KEY;
        const priceId = env.STRIPE_PRICE_ID;

        if (!stripeSecretKey || !priceId) {
          console.error("[create-checkout] Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID");
          return new Response(
            JSON.stringify({ error: "Stripe is not configured on the server" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid request body" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const { userId, userEmail } = body ?? {};

        if (!userId || !userEmail) {
          return new Response(
            JSON.stringify({ error: "Missing userId or userEmail" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const stripe = new Stripe(stripeSecretKey);

        const origin = request.headers.get("origin") ?? "https://playpile.org";

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
      },
    },
  },
});
