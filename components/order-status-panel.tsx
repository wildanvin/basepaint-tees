"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderStatus = {
  status: string;
  paymentStatus: string;
  paymentReference?: string | null;
  displayAmountEth?: string | null;
  receiverAddress?: string | null;
  paymentTxHash?: string | null;
  fulfillmentOrderId?: string | null;
  fulfillmentError?: string | null;
  customerEmail?: string | null;
  expiresAt?: string | null;
};

type OrderStatusResponse = {
  order?: OrderStatus;
  error?: string;
};

const terminalStatuses = new Set([
  "simulated_fulfillment",
  "printful_draft_created",
  "printify_order_created",
  "printify_sent_to_production",
  "fulfillment_failed",
  "expired",
  "cancelled",
  "refunded",
]);

function statusTitle(status?: string) {
  switch (status) {
    case "pending_payment":
      return "Waiting for payment";
    case "paid":
      return "Payment confirmed";
    case "simulated_fulfillment":
      return "Order queued";
    case "printful_draft_created":
      return "Order queued";
    case "printify_order_created":
      return "Order queued";
    case "printify_sent_to_production":
      return "Production started";
    case "fulfillment_failed":
      return "Order needs review";
    default:
      return "Checking order";
  }
}

export function OrderStatusPanel({
  initialOrder,
  reference,
}: {
  initialOrder?: OrderStatus;
  reference: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isActive = true;

    async function loadOrder() {
      const response = await fetch(`/api/checkout?reference=${encodeURIComponent(reference)}`);
      const data = (await response.json()) as OrderStatusResponse;

      if (!isActive) {
        return;
      }

      if (!response.ok || data.error || !data.order) {
        setError(data.error ?? "Unable to load order.");
        return;
      }

      setError(undefined);
      setOrder(data.order);
    }

    const interval = window.setInterval(() => {
      if (!order || !terminalStatuses.has(order.status)) {
        void loadOrder();
      }
    }, 5000);

    void loadOrder();

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [order, reference]);

  return (
    <div className="border border-white/15 bg-[#0b0d10] p-8 shadow-[8px_8px_0_#41c7ff]">
      <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]">
        Order status
      </p>
      <h1 className="mt-4 font-mono text-4xl font-black tracking-tight text-white">
        {statusTitle(order?.status)}
      </h1>
      <p className="mt-4 text-lg leading-8 text-white/65">
        This page updates automatically after your Base payment is confirmed.
      </p>

      {error ? (
        <p className="mt-5 border border-[#ff4d6d] bg-[#2c090f] p-3 text-sm font-semibold text-[#ff8fa3]">
          {error}
        </p>
      ) : null}

      {order ? (
        <dl className="mt-6 grid gap-4 text-sm text-white">
          <div>
            <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
              Status
            </dt>
            <dd className="mt-1 text-lg font-semibold">{statusTitle(order.status)}</dd>
          </div>
          <div>
            <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
              Payment
            </dt>
            <dd className="mt-1 break-all">
              {order.paymentTxHash
                ? "Confirmed on Base"
                : `${order.displayAmountEth ?? "Exact"} ETH pending`}
            </dd>
          </div>
          <div>
            <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
              Production
            </dt>
            <dd className="mt-1">{statusTitle(order.status)}</dd>
          </div>
          {order.expiresAt ? (
            <div>
              <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
                Expires
              </dt>
              <dd className="mt-1">{new Date(order.expiresAt).toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <dl className="mt-6 grid gap-4 text-sm text-white">
          <div>
            <dt className="font-mono font-black uppercase tracking-[0.14em] text-[#41c7ff]">
              Reference
            </dt>
            <dd className="mt-1 break-all">{reference}</dd>
          </div>
        </dl>
      )}

      <Link
        className="mt-8 inline-flex min-h-12 items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-5 font-mono text-sm font-black uppercase tracking-[0.14em] text-[#050608]"
        href="/"
      >
        Back to today&apos;s tee
      </Link>
    </div>
  );
}
