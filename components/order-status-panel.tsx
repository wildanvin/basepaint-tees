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
      return "Legacy draft created";
    case "printify_order_created":
      return "Printify order created";
    case "printify_sent_to_production":
      return "Printify production started";
    case "fulfillment_failed":
      return "Fulfillment needs review";
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
    <div className="border border-[#171717] bg-white p-8 shadow-[8px_8px_0_#171717]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff4d6d]">
        Order status
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        {statusTitle(order?.status)}
      </h1>
      <p className="mt-4 text-lg leading-8 text-[#4a4a4a]">
        This page updates automatically after the Base payment is detected.
      </p>

      {error ? (
        <p className="mt-5 border border-[#ff4d6d] bg-[#fff1f4] p-3 text-sm font-semibold text-[#b00020]">
          {error}
        </p>
      ) : null}

      {order ? (
        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
              Status
            </dt>
            <dd className="mt-1 text-lg font-semibold">{order.status}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
              Payment
            </dt>
            <dd className="mt-1 break-all">
              {order.paymentTxHash ?? `${order.displayAmountEth ?? "Exact"} ETH pending`}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
              Receiver
            </dt>
            <dd className="mt-1 break-all">{order.receiverAddress ?? "Pending"}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
              Fulfillment
            </dt>
            <dd className="mt-1 break-all">
              {order.fulfillmentOrderId ?? order.fulfillmentError ?? "Waiting for payment"}
            </dd>
          </div>
          {order.expiresAt ? (
            <div>
              <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
                Expires
              </dt>
              <dd className="mt-1">{new Date(order.expiresAt).toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="font-semibold uppercase tracking-[0.14em] text-[#696969]">
              Reference
            </dt>
            <dd className="mt-1 break-all">{reference}</dd>
          </div>
        </dl>
      )}

      <Link
        className="mt-8 inline-flex min-h-12 items-center justify-center border border-[#171717] bg-[#171717] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
        href="/"
      >
        Back to today&apos;s tee
      </Link>
    </div>
  );
}
