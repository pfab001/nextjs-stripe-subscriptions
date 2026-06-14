import { PLANS } from "@/lib/plans";
import { PricingCard } from "@/components/PricingCard";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Pricing
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Simple, transparent plans
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          A reference implementation of recurring subscriptions with Stripe
          Checkout and webhooks. Pick a plan to run a full test checkout.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-slate-400">
        Test mode — use card{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
          4242 4242 4242 4242
        </code>{" "}
        with any future expiry and CVC.
      </p>
    </main>
  );
}
