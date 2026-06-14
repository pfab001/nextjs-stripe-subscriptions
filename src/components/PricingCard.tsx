"use client";

import { useState } from "react";
import type { Plan } from "@/lib/plans";

interface PricingCardProps {
  plan: Plan;
}

/**
 * A single pricing tier. Clicking the CTA posts to /api/checkout, then redirects
 * the browser to Stripe's hosted checkout. Loading and error states are handled
 * inline so the button can never be double-submitted.
 */
export function PricingCard({ plan }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 transition ${
        plan.highlighted
          ? "border-indigo-500 bg-white shadow-xl shadow-indigo-100 ring-1 ring-indigo-500"
          : "border-slate-200 bg-white"
      }`}
    >
      {plan.highlighted && (
        <span className="mb-4 inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Most popular
        </span>
      )}

      <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
      <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">
          {plan.price}
        </span>
        <span className="text-sm text-slate-500">{plan.cadence}</span>
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-none text-indigo-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={`mt-8 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          plan.highlighted
            ? "bg-indigo-600 text-white hover:bg-indigo-500"
            : "bg-slate-900 text-white hover:bg-slate-700"
        }`}
      >
        {loading ? "Redirecting…" : `Subscribe to ${plan.name}`}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
