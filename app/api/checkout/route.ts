import {
  createCheckoutQuote,
  getRecentReceiverTransfers,
  matchAndConfirmTransfer,
} from "@/lib/base-payments";
import { getCheckoutPricing } from "@/lib/checkout-pricing";
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
import { getAuthenticatedUser, isAdminUser, syncUserProfile } from "@/lib/supabase-auth";
import { normalizeWalletAddress } from "@/lib/wallet-address";

type CheckoutInput = {
  dailyProductId?: string;
  size?: ShirtSize;
  customerEmail?: string;
  customerName?: string;
  walletAddress?: string;
  shipping?: Partial<ShippingAddress>;
};

const validSizes: ShirtSize[] = ["S", "M", "L", "XL", "2XL"];
const deliveryReferenceMaxLength = 60;

function validateText(value: string | undefined, label: string) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function validateOptionalText(value: string | undefined | null, label: string, maxLength: number) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
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
    reference: validateOptionalText(
      input.reference,
      "Delivery reference",
      deliveryReferenceMaxLength,
    ),
    city: validateText(input.city, "City"),
    state: input.state?.trim() || null,
    postalCode: validateText(input.postalCode, "Postal code"),
    country: validateText(input.country, "Country").toUpperCase(),
  };
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CheckoutInput;
    const user = await getAuthenticatedUser();
    const product = await getActiveProduct();

    if (!user) {
      return Response.json({ error: "Sign in with Ethereum before payment." }, { status: 401 });
    }

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
        { error: "Checkout is not available for today's tee yet." },
        { status: 409 },
      );
    }

    const customerEmail = validateText(input.customerEmail, "Email");
    const customerName = validateText(input.customerName, "Full name");
    const walletAddress = normalizeWalletAddress(input.walletAddress);

    if (!walletAddress) {
      return Response.json({ error: "Connected wallet address is required." }, { status: 400 });
    }

    await syncUserProfile({ user, walletAddress });

    const shipping = validateShipping(input.shipping);
    const fulfillmentQuote = await calculatePrintifyShipping({
      product,
      size: input.size,
      shipping,
      customerName,
      customerEmail,
    });
    const pricing = getCheckoutPricing({
      productPriceCents: product.priceCents,
      shippingCostCents: fulfillmentQuote.shippingCostCents,
      isAdmin: await isAdminUser(user.id),
    });
    const quote = await createCheckoutQuote({
      priceCents: pricing.totalChargeCents,
      size: input.size,
    });
    const order = await createPaymentOrder({
      dailyProductId: product.id,
      userId: user.id,
      authWalletAddress: walletAddress,
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
      totalPriceCents: pricing.totalChargeCents,
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
      productPrice: formatPrice(pricing.productChargeCents, product.currency),
      shippingPrice: formatPrice(pricing.shippingChargeCents, product.currency),
      fiatPrice: formatPrice(pricing.totalChargeCents, product.currency),
      shippingCostCents: fulfillmentQuote.shippingCostCents,
      totalPriceCents: pricing.totalChargeCents,
      isAdminDiscount: pricing.isAdminDiscount,
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
