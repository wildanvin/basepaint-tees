import {
  extractAlchemyTransfers,
  matchAndConfirmTransfer,
  verifyAlchemySignature,
} from "@/lib/base-payments";
import { fulfillPaidOrder } from "@/lib/fulfillment";

export async function POST(request: Request) {
  const body = await request.text();

  try {
    if (
      !verifyAlchemySignature({
        body,
        signature: request.headers.get("x-alchemy-signature"),
      })
    ) {
      return Response.json({ error: "Invalid Alchemy signature." }, { status: 400 });
    }

    const payload = JSON.parse(body) as unknown;
    const transfers = extractAlchemyTransfers(payload);
    const results = [];

    for (const transfer of transfers) {
      const result = await matchAndConfirmTransfer(transfer, "alchemy_webhook");
      const shouldFulfill =
        result.order?.paymentStatus === "confirmed" &&
        (result.order.status === "paid" || result.order.status === "fulfillment_failed");
      const order =
        result.order && shouldFulfill ? await fulfillPaidOrder(result.order) : result.order;

      results.push({
        txHash: transfer.txHash,
        matched: result.matched,
        duplicate: result.duplicate,
        orderId: order?.id,
        status: order?.status,
      });
    }

    return Response.json({ received: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
