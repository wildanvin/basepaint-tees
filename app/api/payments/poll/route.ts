import { getRecentReceiverTransfers, matchAndConfirmTransfer } from "@/lib/base-payments";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import { requireAdminUser } from "@/lib/supabase-auth";

export async function POST() {
  try {
    const { isAdmin } = await requireAdminUser();

    if (!isAdmin) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const transfers = await getRecentReceiverTransfers();
    const results = [];

    for (const transfer of transfers) {
      const result = await matchAndConfirmTransfer(transfer, "alchemy_poll");
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

    return Response.json({ checked: transfers.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to poll payments.";

    return Response.json({ error: message }, { status: 500 });
  }
}
