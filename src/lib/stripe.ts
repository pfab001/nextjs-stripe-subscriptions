import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

/**
 * Server-side Stripe client.
 *
 * Instantiated once and reused across requests. Never import this into a
 * Client Component — the secret key must stay on the server.
 *
 * `apiVersion` is intentionally left unset so the client uses the version
 * pinned to your Stripe account. Pin it explicitly (e.g. via the dashboard or
 * the constructor) once you go to production so behaviour can't shift under you.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});
