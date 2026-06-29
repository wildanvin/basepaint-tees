import {
  createCheckoutQuote,
  getRecentReceiverTransfers,
  matchAndConfirmTransfer,
} from "@/lib/base-payments";
import { formatPrice, type ShirtSize } from "@/lib/demo-product";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import {
  createPaymentOrder,
  getFulfillmentMode,
  getOrderByPaymentReference,
  type ShippingAddress,
} from "@/lib/order-store";
import { calculatePrintifyShipping } from "@/lib/printify";
import { getActiveProduct } from "@/lib/product-store";

type CheckoutInput = {
  dailyProductId?: string;
  size?: ShirtSize;
  customerEmail?: string;
  customerName?: string;
  shipping?: Partial<ShippingAddress>;
};

const validSizes: ShirtSize[] = ["S", "M", "L", "XL", "2XL"];

function validateText(value: string | undefined, label: string) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function validateShipping(input: CheckoutInput["shipping"]): ShippingAddress {
  if (!input) {
    throw new Error("Shipping address is required.");
  }

  return {
    line1: validateText(input.line1, "Address line 1"),
    line2: input.line2?.trim() || null,
    city: validateText(input.city, "City"),
    state: input.state?.trim() || null,
    postalCode: validateText(input.postalCode, "Postal code"),
    country: validateText(input.country, "Country").toUpperCase(),
  };
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CheckoutInput;
    const product = await getActiveProduct();

    if (!product) {
      return Response.json(
        { error: "No active product is available. Run the daily sync first." },
        { status: 404 },
      );
    }

    if (input.dailyProductId !== product.id) {
      return Response.json({ error: "Product is no longer active." }, { status: 409 });
    }

    if (!input.size || !validSizes.includes(input.size)) {
      return Response.json({ error: "Select a valid shirt size." }, { status: 400 });
    }

    if (!product.printifyProductId || !product.printifyVariants) {
      return Response.json(
        { error: "Product is not synced to Printify yet. Run the daily sync first." },
        { status: 409 },
      );
    }

    const customerEmail = validateText(input.customerEmail, "Email");
    const customerName = validateText(input.customerName, "Full name");
    const shipping = validateShipping(input.shipping);
    const fulfillmentQuote = await calculatePrintifyShipping({
      product,
      size: input.size,
      shipping,
      customerName,
      customerEmail,
    });
    const totalPriceCents = product.priceCents + fulfillmentQuote.shippingCostCents;
    const quote = await createCheckoutQuote({
      priceCents: totalPriceCents,
      size: input.size,
    });
    const order = await createPaymentOrder({
      dailyProductId: product.id,
      customerEmail,
      customerName,
      shipping,
      size: input.size,
      fulfillmentMode: getFulfillmentMode(),
      paymentReference: quote.paymentReference,
      chainId: quote.chainId,
      receiverAddress: quote.receiverAddress,
      expectedAmountWei: quote.expectedAmountWei,
      displayAmountEth: quote.displayAmountEth,
      ethUsdPrice: quote.ethUsdPrice,
      expiresAt: quote.expiresAt,
      shippingCostCents: fulfillmentQuote.shippingCostCents,
      totalPriceCents,
      printifyVariantId: fulfillmentQuote.fulfillment.variantId,
      printifyBlueprintId: fulfillmentQuote.fulfillment.blueprintId,
      printifyPrintProviderId: fulfillmentQuote.fulfillment.printProviderId,
      printifyShippingMethod: fulfillmentQuote.fulfillment.shippingMethod,
    });

    return Response.json({
      orderId: order.id,
      paymentReference: quote.paymentReference,
      orderUrl: `/order/${quote.paymentReference}`,
      productName: product.name,
      productPrice: formatPrice(product.priceCents, product.currency),
      shippingPrice: formatPrice(fulfillmentQuote.shippingCostCents, product.currency),
      fiatPrice: formatPrice(totalPriceCents, product.currency),
      shippingCostCents: fulfillmentQuote.shippingCostCents,
      totalPriceCents,
      receiverAddress: quote.receiverAddress,
      chainId: quote.chainId,
      expectedAmountWei: quote.expectedAmountWei,
      displayAmountEth: quote.displayAmountEth,
      ethUsdPrice: quote.ethUsdPrice,
      expiresAt: quote.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout.";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const paymentReference = new URL(request.url).searchParams.get("reference");

  if (!paymentReference) {
    return Response.json({ error: "Missing payment reference." }, { status: 400 });
  }

  let order = await getOrderByPaymentReference(paymentReference);

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.paymentStatus === "pending") {
    const transfers = await getRecentReceiverTransfers();

    for (const transfer of transfers) {
      const result = await matchAndConfirmTransfer(transfer, "alchemy_poll");

      if (result.order?.id === order.id) {
        order = result.order;
        break;
      }
    }
  }

  const shouldFulfill =
    order.paymentStatus === "confirmed" &&
    (order.status === "paid" || order.status === "fulfillment_failed");
  const fulfilledOrder = shouldFulfill ? await fulfillPaidOrder(order) : order;

  return Response.json({ order: fulfilledOrder });
}
