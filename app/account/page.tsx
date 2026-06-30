import Link from "next/link";
import { AccountButton } from "@/components/account-button";
import { formatPrice } from "@/lib/demo-product";
import { getOrdersByUserId } from "@/lib/order-store";
import { getActiveProduct } from "@/lib/product-store";
import { getAuthenticatedUser, getUserProfile } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

function shortAddress(address?: string | null) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown";
}

export default async function AccountPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-6 py-12 text-[#171717]">
        <section className="mx-auto max-w-3xl border border-[#171717] bg-white p-8 shadow-[8px_8px_0_#171717]">
          <Link className="text-sm font-bold uppercase tracking-[0.18em]" href="/">
            BasePaint Tees
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#ff4d6d]">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Sign in to view orders
          </h1>
          <p className="mt-4 text-lg text-[#4a4a4a]">
            Connect with Ethereum on Base to see orders linked to your account.
          </p>
          <div className="mt-6">
            <AccountButton />
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
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-12 text-[#171717]">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 border-b border-[#171717]/15 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-bold uppercase tracking-[0.18em]" href="/">
              BasePaint Tees
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#ff4d6d]">
              Account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Your orders
            </h1>
            <p className="mt-3 text-[#4a4a4a]">
              Signed in as {shortAddress(profile?.wallet_address)}.
            </p>
          </div>
          <AccountButton />
        </div>

        <div className="mt-8 grid gap-4">
          {orders.length === 0 ? (
            <div className="border border-[#171717] bg-white p-6 shadow-[8px_8px_0_#171717]">
              <p className="text-lg font-semibold">No linked orders yet.</p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center justify-center border border-[#171717] bg-[#171717] px-4 text-sm font-semibold uppercase tracking-[0.14em] text-white"
                href="/"
              >
                Buy today&apos;s tee
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <article
                className="border border-[#171717] bg-white p-5 shadow-[6px_6px_0_#171717]"
                key={order.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                    {order.status} · {order.size}
                  </p>
                  <time className="text-xs uppercase tracking-[0.14em] text-[#696969]">
                    {new Date(order.createdAt).toLocaleString()}
                  </time>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
                      Total
                    </dt>
                    <dd>
                      {order.totalPriceCents
                        ? formatPrice(order.totalPriceCents, currency)
                        : "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
                      Payment
                    </dt>
                    <dd className="break-all">
                      {order.paymentTxHash ?? order.displayAmountEth ?? "Pending"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
                      Fulfillment
                    </dt>
                    <dd>{order.fulfillmentOrderId ?? order.fulfillmentError ?? "Pending"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
                      Reference
                    </dt>
                    <dd className="break-all">{order.paymentReference ?? order.id}</dd>
                  </div>
                </dl>
                {order.paymentReference ? (
                  <Link
                    className="mt-4 inline-flex font-semibold underline underline-offset-4"
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
