import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-16 text-[#171717]">
      <section className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link className="text-sm font-semibold uppercase tracking-[0.18em]" href="/">
          BasePaint Tees
        </Link>
        <div className="border border-[#171717] bg-white p-8 shadow-[8px_8px_0_#171717]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Payment pending
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Waiting for Base confirmation.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#4a4a4a]">
            Once Alchemy detects the exact ETH transfer, the order will move to
            fulfillment automatically.
          </p>
          {reference ? (
            <p className="mt-5 break-all border border-[#171717]/15 bg-[#f7f4ee] p-3 text-sm text-[#4a4a4a]">
              Payment reference: {reference}
            </p>
          ) : null}
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center border border-[#171717] bg-[#171717] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            href="/admin"
          >
            View admin status
          </Link>
        </div>
      </section>
    </main>
  );
}
