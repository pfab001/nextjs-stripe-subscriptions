import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/webhook
 *
 * Receives events from Stripe. Two things matter here and trip people up most:
 *
 *  1. Signature verification needs the *raw* request body, so we read
 *     `await request.text()` rather than `request.json()`. Parsing the JSON
 *     first would change the bytes and break verification.
 *  2. This route must stay on the Node.js runtime — the Edge runtime can't run
 *     Stripe's signature crypto.
 *
 * Handlers are deliberately idempotent-friendly: Stripe may deliver the same
 * event more than once, so any real persistence here should upsert, not insert.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // The subscription now exists. In a real app, look up the user via
        // session.client_reference_id / session.metadata and mark them active.
        console.log(
          `✓ Checkout completed for plan "${session.metadata?.planId}" ` +
            `(subscription ${String(session.subscription)})`,
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Fires on upgrades, downgrades, cancellations scheduled for period end,
        // and renewals. Sync `subscription.status` to your DB.
        console.log(
          `↻ Subscription ${subscription.id} updated → ${subscription.status}`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Access has actually ended. Revoke entitlements here.
        console.log(`✗ Subscription ${subscription.id} ended`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // A renewal charge failed. Stripe will retry per your dunning settings;
        // this is the hook for "your payment didn't go through" emails.
        console.log(`! Payment failed for invoice ${invoice.id}`);
        break;
      }

      default:
        // Unhandled events are fine to acknowledge — Stripe just needs a 2xx.
        break;
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
