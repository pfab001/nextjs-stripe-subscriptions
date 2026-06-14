import Link from "next/link";
import { stripe } from "@/lib/stripe";

/**
 * Confirmation page. Stripe redirects here with `?session_id=...` after a
 * successful checkout. We retrieve the session server-side to display real
 * details — never trust the query string alone to grant access; the webhook is
 * the source of truth for entitlement.
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let email: string | null = null;
  let valid = false;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      valid = session.payment_status === "paid" || session.status === "complete";
      email = session.customer_details?.email ?? null;
    } catch {
      valid = false;
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      {valid ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-7 w-7 text-green-600"
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
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            You&apos;re subscribed
          </h1>
          <p className="mt-2 text-slate-500">
            {email
              ? `A receipt is on its way to ${email}.`
              : "Your subscription is now active."}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-900">
            We couldn&apos;t confirm that session
          </h1>
          <p className="mt-2 text-slate-500">
            If you completed payment, your subscription may still be processing.
          </p>
        </>
      )}

      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Back to pricing
      </Link>
    </main>
  );
}
