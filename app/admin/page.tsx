import Link from "next/link";
import { AdminAgentPanel } from "@/components/admin-agent-panel";
import { getDailyProduct } from "@/lib/basepaint";
import { formatPrice } from "@/lib/demo-product";
import { getActiveProduct, getRecentAgentRuns } from "@/lib/mock-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const product = getActiveProduct() ?? (await getDailyProduct());
  const runs = getRecentAgentRuns();
  const rows = [
    ["BasePaint day", `#${product.basepaintDay}`],
    ["Theme", product.theme],
    ["Shirt color", product.shirtColor],
    ["Price", formatPrice(product.priceCents, product.currency)],
    ["Data source", product.dataSource],
    ["Fetch status", product.statusMessage],
    ["Stripe status", "Not connected"],
    ["Fulfillment mode", "Demo checkout"],
    ["Recent orders", "None"],
  ];

  return (
    <main className="min-h-screen bg-[#111111] px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 border-b border-white/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#41c7ff]">
              Internal dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Daily product status
            </h1>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center border border-white/30 px-4 text-sm font-semibold uppercase tracking-[0.14em]"
            href="/"
          >
            View storefront
          </Link>
        </div>

        <div className="mt-8 overflow-hidden border border-white/20">
          {rows.map(([label, value]) => (
            <div
              className="grid gap-2 border-b border-white/10 p-5 last:border-b-0 sm:grid-cols-[220px_1fr]"
              key={label}
            >
              <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">
                {label}
              </dt>
              <dd className="text-lg text-white">{value}</dd>
            </div>
          ))}
        </div>

        <AdminAgentPanel initialRuns={runs} />
      </section>
    </main>
  );
}
