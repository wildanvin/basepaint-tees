import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-16 text-[#171717]">
      <section className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link className="text-sm font-semibold uppercase tracking-[0.18em]" href="/">
          BasePaint Tees
        </Link>
        <div className="border border-[#171717] bg-white p-8 shadow-[8px_8px_0_#171717]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Demo confirmation
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Thanks, your tee is queued.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#4a4a4a]">
            In the real checkout flow, this page will show the Stripe payment
            result and the fulfillment status for the Printful order.
          </p>
        </div>
      </section>
    </main>
  );
}
