import "server-only";

import type { OrderRecord } from "@/lib/order-store";
import { getFulfillmentMode, updateOrderFulfillment } from "@/lib/order-store";
import { createPrintifyOrder, sendPrintifyOrderToProduction } from "@/lib/printify";
import { getProductById } from "@/lib/product-store";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown fulfillment error";
}

export async function fulfillPaidOrder(order: OrderRecord) {
  if (order.status !== "paid" && order.status !== "fulfillment_failed") {
    return order;
  }

  if (order.paymentStatus !== "confirmed") {
    return order;
  }

  const fulfillmentMode = getFulfillmentMode();

  if (fulfillmentMode === "mock") {
    return updateOrderFulfillment({
      orderId: order.id,
      status: "simulated_fulfillment",
      fulfillmentOrderId: `mock_${order.paymentTxHash ?? order.id}`,
      fulfillmentError: null,
    });
  }

  if (!["printify_draft", "printify_live"].includes(fulfillmentMode)) {
    return updateOrderFulfillment({
      orderId: order.id,
      status: "fulfillment_failed",
      fulfillmentError: `Unsupported fulfillment mode: ${fulfillmentMode}`,
    });
  }

  try {
    if (!order.dailyProductId) {
      throw new Error("Paid order is missing daily product id.");
    }

    const product = await getProductById(order.dailyProductId);

    if (!product) {
      throw new Error(`Product ${order.dailyProductId} no longer exists.`);
    }

    const printifyOrder = await createPrintifyOrder({ order, product });

    if (fulfillmentMode === "printify_live") {
      const productionOrder = await sendPrintifyOrderToProduction(printifyOrder.id);

      return updateOrderFulfillment({
        orderId: order.id,
        status: "printify_sent_to_production",
        fulfillmentOrderId: productionOrder.id ?? printifyOrder.id,
        fulfillmentPayload: { created: printifyOrder, production: productionOrder },
        fulfillmentError: null,
      });
    }

    return updateOrderFulfillment({
      orderId: order.id,
      status: "printify_order_created",
      fulfillmentOrderId: printifyOrder.id,
      fulfillmentPayload: printifyOrder,
      fulfillmentError: null,
    });
  } catch (error) {
    return updateOrderFulfillment({
      orderId: order.id,
      status: "fulfillment_failed",
      fulfillmentError: errorMessage(error),
    });
  }
}
