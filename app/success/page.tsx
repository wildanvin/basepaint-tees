import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-16 text-white">
      <section className="mx-auto flex max-w-2xl flex-col gap-6">
        <BrandLogo />
        <div className="border border-white/15 bg-[#0b0d10] p-8 shadow-[8px_8px_0_#41c7ff]">
          <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]">
            Payment pending
          </p>
          <h1 className="mt-4 font-mono text-4xl font-black tracking-tight">
            Waiting for Base confirmation.
          </h1>
          <p className="mt-4 text-lg leading-8 text-white/65">
            Once the exact ETH transfer is confirmed, your order will move to production
            automatically.
          </p>
          {reference ? (
            <p className="mt-5 break-all border border-white/10 bg-[#050608] p-3 text-sm text-white/65">
              Payment reference: {reference}
            </p>
          ) : null}
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-5 font-mono text-sm font-black uppercase tracking-[0.14em] text-[#050608]"
            href={reference ? `/order/${reference}` : "/"}
          >
            {reference ? "Track order" : "Back to today's tee"}
          </Link>
        </div>
      </section>
    </main>
  );
}
