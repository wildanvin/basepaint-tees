"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SendResponse = {
  ok?: boolean;
  error?: string;
};

export function AdminOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();

  if (status !== "printify_order_created") {
    return null;
  }

  async function sendToProduction() {
    setIsSending(true);
    setError(undefined);

    try {
      const response = await fetch("/api/admin/orders/send-to-production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const payload = (await response.json()) as SendResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to send order to production.");
      }

      router.refresh();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send order to production.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        className="inline-flex min-h-10 items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-4 text-xs font-bold uppercase tracking-[0.14em] text-black disabled:cursor-wait disabled:opacity-60"
        disabled={isSending}
        onClick={sendToProduction}
        type="button"
      >
        {isSending ? "Sending..." : "Send to production"}
      </button>
      {error ? (
        <p className="mt-3 border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
