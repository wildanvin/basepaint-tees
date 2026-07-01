import Link from "next/link";
import { AccountButton } from "@/components/account-button";
import { AdminAgentPanel } from "@/components/admin-agent-panel";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { BrandLogo } from "@/components/brand-logo";
import { getDailyProduct } from "@/lib/basepaint";
import { formatPrice } from "@/lib/demo-product";
import { getFulfillmentMode, getRecentOrders } from "@/lib/order-store";
import { getActiveProduct, getRecentAgentRuns } from "@/lib/product-store";
import { requireAdminUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, isAdmin } = await requireAdminUser();

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-[#111111] px-6 py-12 text-white">
        <section className="mx-auto max-w-3xl border border-white/20 p-8">
          <BrandLogo />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            Internal dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {user ? "Access denied" : "Admin sign in required"}
          </h1>
          <p className="mt-4 text-white/65">
            {user
              ? "Your account is not listed in admin_roles."
              : "Sign in with the admin wallet, then add that user id to admin_roles."}
          </p>
          <div className="mt-6">
            <AccountButton tone="dark" />
          </div>
        </section>
      </main>
    );
  }

  const [storedProduct, runs, orders] = await Promise.all([
    getActiveProduct().catch(() => undefined),
    getRecentAgentRuns().catch(() => []),
    getRecentOrders().catch(() => []),
  ]);
  const product = storedProduct ?? (await getDailyProduct());
  const rows = [
    ["BasePaint day", `#${product.basepaintDay}`],
    ["Theme", product.theme],
    ["Shirt color", product.shirtColor],
    ["Price", formatPrice(product.priceCents, product.currency)],
    ["Data source", product.dataSource],
    ["Fetch status", product.statusMessage],
    ["Printify product", product.printifyProductId ?? "Not synced"],
    ["Payment status", "Base ETH checkout"],
    ["Fulfillment mode", getFulfillmentMode()],
    ["Recent orders", String(orders.length)],
  ];

  return (
    <main className="min-h-screen bg-[#111111] px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 border-b border-white/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandLogo />
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#41c7ff]">
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
          <AccountButton tone="dark" />
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

        <section className="mt-8 border border-white/20 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Orders
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Recent Base payments
            </h2>
          </div>

          <div className="mt-5 grid gap-3">
            {orders.length === 0 ? (
              <p className="text-sm text-white/55">No orders yet.</p>
            ) : (
              orders.map((order) => (
                <article className="border border-white/10 p-4" key={order.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                      {order.status} · {order.size}
                    </p>
                    <time className="text-xs uppercase tracking-[0.14em] text-white/45">
                      {new Date(order.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                    <div>
                      <dt className="text-white/40">Customer</dt>
                      <dd>{order.customerEmail ?? "Unknown"}</dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Fulfillment</dt>
                      <dd>{order.fulfillmentOrderId ?? order.fulfillmentError ?? order.fulfillmentMode}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-white/40">Payment</dt>
                      <dd className="break-all">
                        {order.paymentTxHash ?? order.paymentReference ?? "pending"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Expected ETH</dt>
                      <dd>{order.displayAmountEth ?? "Unknown"}</dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Total</dt>
                      <dd>
                        {order.totalPriceCents
                          ? formatPrice(order.totalPriceCents, product.currency)
                          : "Unknown"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Payer</dt>
                      <dd className="break-all">{order.payerAddress ?? "Pending"}</dd>
                    </div>
                  </dl>
                  <AdminOrderActions orderId={order.id} status={order.status} />
                </article>
              ))
            )}
          </div>
        </section>

        <AdminAgentPanel initialRuns={runs} />
      </section>
    </main>
  );
}
