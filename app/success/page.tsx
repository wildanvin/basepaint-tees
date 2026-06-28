import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-16 text-[#171717]">
      <section className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link className="text-sm font-semibold uppercase tracking-[0.18em]" href="/">
          BasePaint Tees
        </Link>
        <div className="border border-[#171717] bg-white p-8 shadow-[8px_8px_0_#171717]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Payment received
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Thanks, your tee is queued.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#4a4a4a]">
            Stripe accepted the checkout return. The webhook will create the
            internal order and fulfillment record once it receives the payment
            confirmation.
          </p>
          {sessionId ? (
            <p className="mt-5 break-all border border-[#171717]/15 bg-[#f7f4ee] p-3 text-sm text-[#4a4a4a]">
              Stripe session: {sessionId}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
