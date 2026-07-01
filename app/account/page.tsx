import Link from "next/link";
import { AccountButton } from "@/components/account-button";
import { BrandLogo } from "@/components/brand-logo";
import { formatPrice } from "@/lib/demo-product";
import { getOrdersByUserId } from "@/lib/order-store";
import { getActiveProduct } from "@/lib/product-store";
import { getAuthenticatedUser, getUserProfile } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

function shortAddress(address?: string | null) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown";
}

function orderStatusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Waiting for payment";
    case "paid":
      return "Payment confirmed";
    case "simulated_fulfillment":
    case "printful_draft_created":
    case "printify_order_created":
      return "Order queued";
    case "printify_sent_to_production":
      return "Production started";
    case "fulfillment_failed":
      return "Needs review";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return "Processing";
  }
}

export default async function AccountPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-[#050608] px-6 py-12 text-white">
        <section className="mx-auto max-w-3xl border border-white/15 bg-[#0b0d10] p-8 shadow-[8px_8px_0_#41c7ff]">
          <BrandLogo />
          <p className="mt-8 font-mono text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]">
            Account
          </p>
          <h1 className="mt-3 font-mono text-4xl font-black tracking-tight">
            Sign in to view orders
          </h1>
          <p className="mt-4 text-lg text-white/65">
            Connect with Ethereum on Base to see orders linked to your account.
          </p>
          <div className="mt-6">
            <AccountButton tone="dark" />
          </div>
        </section>
      </main>
    );
  }

  const [profile, orders, product] = await Promise.all([
    getUserProfile(user.id).catch(() => null),
    getOrdersByUserId(user.id).catch(() => []),
    getActiveProduct().catch(() => undefined),
  ]);
  const currency = product?.currency ?? "USD";

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandLogo />
            <p className="mt-8 font-mono text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]">
              Account
            </p>
            <h1 className="mt-3 font-mono text-4xl font-black tracking-tight">
              Your orders
            </h1>
            <p className="mt-3 text-white/65">
              Signed in as {shortAddress(profile?.wallet_address)}.
            </p>
          </div>
          <AccountButton tone="dark" />
        </div>

        <div className="mt-8 grid gap-4">
          {orders.length === 0 ? (
            <div className="border border-white/15 bg-[#0b0d10] p-6 shadow-[8px_8px_0_#41c7ff]">
              <p className="text-lg font-semibold">No linked orders yet.</p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-4 font-mono text-sm font-black uppercase tracking-[0.14em] text-[#050608]"
                href="/"
              >
                Buy today&apos;s tee
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <article
                className="border border-white/15 bg-[#0b0d10] p-5 shadow-[6px_6px_0_#41c7ff]"
                key={order.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                    {orderStatusLabel(order.status)} · {order.size}
                  </p>
                  <time className="text-xs uppercase tracking-[0.14em] text-white/45">
                    {new Date(order.createdAt).toLocaleString()}
                  </time>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
                      Total
                    </dt>
                    <dd>
                      {order.totalPriceCents
                        ? formatPrice(order.totalPriceCents, currency)
                        : "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
                      Payment
                    </dt>
                    <dd className="break-all">
                      {order.paymentTxHash ? "Confirmed on Base" : order.displayAmountEth ?? "Pending"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
                      Production
                    </dt>
                    <dd>{orderStatusLabel(order.status)}</dd>
                  </div>
                  <div>
                    <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
                      Reference
                    </dt>
                    <dd className="break-all">{order.paymentReference ?? order.id}</dd>
                  </div>
                </dl>
                {order.paymentReference ? (
                  <Link
                    className="mt-4 inline-flex font-semibold text-[#41c7ff] underline underline-offset-4"
                    href={`/order/${order.paymentReference}`}
                  >
                    Track order
                  </Link>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
