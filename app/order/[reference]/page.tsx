import { BrandLogo } from "@/components/brand-logo";
import { OrderStatusPanel } from "@/components/order-status-panel";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import { getOrderByPaymentReference } from "@/lib/order-store";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await getOrderByPaymentReference(reference);
  const shouldFulfill =
    order?.paymentStatus === "confirmed" &&
    (order.status === "paid" || order.status === "fulfillment_failed");
  const visibleOrder = shouldFulfill ? await fulfillPaidOrder(order) : order;

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-16 text-white">
      <section className="mx-auto flex max-w-2xl flex-col gap-6">
        <BrandLogo />
        <OrderStatusPanel initialOrder={visibleOrder} reference={reference} />
      </section>
    </main>
  );
}
