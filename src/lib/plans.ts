/**
 * Plan catalogue.
 *
 * Each plan maps a human-facing tier to a Stripe Price ID. Create the products
 * and recurring prices in the Stripe Dashboard (or via the API), then drop the
 * price IDs into your environment. Keeping the IDs in env rather than hard-coded
 * means you can point staging and production at different Stripe data without a
 * code change.
 */
export type PlanId = "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  /** Display price, e.g. "$12". Billing is driven by the Stripe Price, not this. */
  price: string;
  cadence: string;
  description: string;
  features: string[];
  /** Stripe Price ID (price_...). */
  priceId: string;
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$12",
    cadence: "per month",
    description: "Everything one person needs to get going.",
    features: ["Up to 3 projects", "Community support", "1 GB storage"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "per month",
    description: "For teams shipping in production.",
    features: [
      "Unlimited projects",
      "Priority support",
      "50 GB storage",
      "Usage analytics",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
    highlighted: true,
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}
