import { createEstimatedCheckoutQuote } from "@/lib/base-payments";
import { formatPrice, type ShirtSize } from "@/lib/demo-product";
import { type ShippingAddress } from "@/lib/order-store";
import { calculatePrintifyShipping } from "@/lib/printify";
import { getActiveProduct } from "@/lib/product-store";

type QuoteInput = {
  dailyProductId?: string;
  size?: ShirtSize;
  customerEmail?: string;
  customerName?: string;
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

function validateShipping(input: QuoteInput["shipping"]): ShippingAddress {
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
    const input = (await request.json()) as QuoteInput;
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
    const estimatedQuote = await createEstimatedCheckoutQuote({ priceCents: totalPriceCents });

    return Response.json({
      productName: product.name,
      productPrice: formatPrice(product.priceCents, product.currency),
      shippingPrice: formatPrice(fulfillmentQuote.shippingCostCents, product.currency),
      fiatPrice: formatPrice(totalPriceCents, product.currency),
      shippingCostCents: fulfillmentQuote.shippingCostCents,
      totalPriceCents,
      chainId: estimatedQuote.chainId,
      displayAmountEth: estimatedQuote.displayAmountEth,
      ethUsdPrice: estimatedQuote.ethUsdPrice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to quote checkout.";

    return Response.json({ error: message }, { status: 500 });
  }
}
