import type Stripe from "stripe";
import { createOrder, getFulfillmentMode, getOrderByStripeSession } from "@/lib/order-store";
import { getStripe } from "@/lib/stripe";
import type { ShirtSize } from "@/lib/demo-product";

const validSizes: ShirtSize[] = ["S", "M", "L", "XL", "2XL"];

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return secret;
}

function getPaymentIntentId(paymentIntent: Stripe.Checkout.Session["payment_intent"]) {
  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function getShippingDetails(session: Stripe.Checkout.Session) {
  const collectedShipping = session.collected_information?.shipping_details;

  if (collectedShipping) {
    return {
      name: collectedShipping.name,
      address: collectedShipping.address,
    };
  }

  return {
    name: session.customer_details?.name ?? null,
    address: session.customer_details?.address ?? null,
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const existingOrder = await getOrderByStripeSession(session.id);

  if (existingOrder) {
    return { order: existingOrder, created: false };
  }

  const dailyProductId = session.metadata?.daily_product_id;
  const size = session.metadata?.size as ShirtSize | undefined;

  if (!dailyProductId) {
    throw new Error(`Checkout session ${session.id} is missing daily_product_id metadata.`);
  }

  if (!size || !validSizes.includes(size)) {
    throw new Error(`Checkout session ${session.id} has an invalid size.`);
  }

  const fulfillmentMode = getFulfillmentMode();
  const shipping = getShippingDetails(session);
  const paymentIntentId = getPaymentIntentId(session.payment_intent);

  if (fulfillmentMode !== "mock") {
    return {
      order: await createOrder({
        dailyProductId,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        customerEmail: session.customer_details?.email ?? session.customer_email,
        customerName: shipping.name,
        shipping: shipping.address,
        size,
        status: "fulfillment_failed",
        fulfillmentMode,
        printfulOrderId: null,
      }),
      created: true,
    };
  }

  const order = await createOrder({
    dailyProductId,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    customerEmail: session.customer_details?.email ?? session.customer_email,
    customerName: shipping.name,
    shipping: shipping.address,
    size,
    status: "simulated_fulfillment",
    fulfillmentMode,
    printfulOrderId: `mock_${session.id}`,
  });

  return { order, created: true };
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook.";

    return Response.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await handleCheckoutCompleted(session);

      return Response.json({ received: true, order: result.order, created: result.created });
    }

    return Response.json({ received: true, ignored: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
