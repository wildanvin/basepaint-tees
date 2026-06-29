import { getOrderById, updateOrderFulfillment } from "@/lib/order-store";
import { sendPrintifyOrderToProduction } from "@/lib/printify";

type SendToProductionInput = {
  orderId?: string;
};

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as SendToProductionInput;

    if (!input.orderId) {
      return Response.json({ error: "Missing order id." }, { status: 400 });
    }

    const order = await getOrderById(input.orderId);

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status === "printify_sent_to_production") {
      return Response.json({ ok: true, order });
    }

    if (order.status !== "printify_order_created") {
      return Response.json(
        { error: `Order status must be printify_order_created. Current status: ${order.status}.` },
        { status: 409 },
      );
    }

    if (order.paymentStatus !== "confirmed") {
      return Response.json({ error: "Order payment is not confirmed." }, { status: 409 });
    }

    if (!order.fulfillmentOrderId) {
      return Response.json(
        { error: "Order is missing a Printify fulfillment order id." },
        { status: 409 },
      );
    }

    const productionOrder = await sendPrintifyOrderToProduction(order.fulfillmentOrderId);
    const updatedOrder = await updateOrderFulfillment({
      orderId: order.id,
      status: "printify_sent_to_production",
      fulfillmentOrderId: productionOrder.id ?? order.fulfillmentOrderId,
      fulfillmentPayload: {
        previous: order.fulfillmentPayload,
        production: productionOrder,
      },
      fulfillmentError: null,
    });

    return Response.json({ ok: true, order: updatedOrder });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send order to production.";

    return Response.json({ error: message }, { status: 500 });
  }
}
