import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getPlan } from "@/lib/plans";

/**
 * POST /api/checkout
 *
 * Body: { planId: "starter" | "pro" }
 *
 * Creates a Stripe Checkout Session in subscription mode and returns the hosted
 * checkout URL. The client redirects the customer there; Stripe handles card
 * entry, 3DS, receipts and dunning. On completion the customer is sent to
 * /success and a `checkout.session.completed` webhook fires (see /api/webhook).
 */
export async function POST(request: Request) {
  try {
    const { planId } = (await request.json()) as { planId?: string };

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const plan = getPlan(planId);
    if (!plan || !plan.priceId) {
      return NextResponse.json(
        { error: "Unknown or unconfigured plan" },
        { status: 400 },
      );
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
      // Surfaces the customer's email back on the session and lets Stripe
      // de-duplicate customers if you later attach your own user IDs.
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // In a real app, set `client_reference_id` / `metadata` to your user ID
      // so the webhook can reconcile the subscription to an account.
      metadata: { planId: plan.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong creating the checkout session" },
      { status: 500 },
    );
  }
}
