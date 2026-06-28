import { getActiveProduct } from "@/lib/product-store";
import { stripeAllowedShippingCountries } from "@/lib/shipping-countries";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import type { ShirtSize } from "@/lib/demo-product";

type CheckoutInput = {
  dailyProductId?: string;
  size?: ShirtSize;
};

const validSizes: ShirtSize[] = ["S", "M", "L", "XL", "2XL"];

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

    const siteUrl = getSiteUrl(request.url);
    const stripe = getStripe();
    const imageUrl = product.mockupBackUrl ?? product.mockupFrontUrl ?? product.artUrl;
    const metadata = {
      daily_product_id: product.id,
      basepaint_day: String(product.basepaintDay),
      size: input.size,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      client_reference_id: product.id,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      shipping_address_collection: {
        allowed_countries: stripeAllowedShippingCountries,
      },
      metadata,
      payment_intent_data: {
        metadata,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency.toLowerCase(),
            unit_amount: product.priceCents,
            product_data: {
              name: product.name,
              description: `${product.theme} / ${product.shirtColor} / ${input.size}`,
              images: imageUrl ? [imageUrl] : undefined,
              metadata: {
                basepaint_day: String(product.basepaintDay),
                shirt_color: product.shirtColor,
              },
            },
          },
        },
      ],
    });

    if (!session.url) {
      return Response.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout.";

    return Response.json({ error: message }, { status: 500 });
  }
}
