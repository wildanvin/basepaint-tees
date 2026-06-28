import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-16 text-[#171717]">
      <section className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link className="text-sm font-semibold uppercase tracking-[0.18em]" href="/">
          BasePaint Tees
        </Link>
        <div className="border border-[#171717] bg-white p-8 shadow-[8px_8px_0_#171717]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Checkout canceled
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            No order was placed.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#4a4a4a]">
            Stripe Checkout was canceled before payment. You can return to the
            daily tee and try again with the same selected product.
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center border border-[#171717] bg-[#171717] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            href="/"
          >
            Back to today&apos;s tee
          </Link>
        </div>
      </section>
    </main>
  );
}
