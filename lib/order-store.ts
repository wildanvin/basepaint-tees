import "server-only";

import type Stripe from "stripe";
import type { ShirtSize } from "@/lib/demo-product";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type OrderStatus =
  | "paid"
  | "simulated_fulfillment"
  | "printful_draft_created"
  | "printful_confirmed"
  | "fulfillment_failed"
  | "cancelled"
  | "refunded";

export type OrderRecord = {
  id: string;
  dailyProductId: string | null;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  printfulOrderId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  shipping: Stripe.Address | null;
  size: ShirtSize;
  status: OrderStatus;
  fulfillmentMode: string;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  id: string;
  daily_product_id: string | null;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  printful_order_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_json: Stripe.Address | null;
  size: string;
  status: string;
  fulfillment_mode: string;
  created_at: string;
  updated_at: string;
};

type CreateOrderInput = {
  dailyProductId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  shipping: Stripe.Address | null;
  size: ShirtSize;
  status: OrderStatus;
  fulfillmentMode: string;
  printfulOrderId?: string | null;
};

function orderFromRow(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    dailyProductId: row.daily_product_id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    printfulOrderId: row.printful_order_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    shipping: row.shipping_json,
    size: row.size as ShirtSize,
    status: row.status as OrderStatus,
    fulfillmentMode: row.fulfillment_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getFulfillmentMode() {
  return process.env.FULFILLMENT_MODE ?? "mock";
}

export async function getOrderByStripeSession(stripeSessionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  return data ? orderFromRow(data as OrderRow) : undefined;
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      daily_product_id: input.dailyProductId,
      stripe_session_id: input.stripeSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      printful_order_id: input.printfulOrderId ?? null,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      shipping_json: input.shipping,
      size: input.size,
      status: input.status,
      fulfillment_mode: input.fulfillmentMode,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const existingOrder = await getOrderByStripeSession(input.stripeSessionId);

      if (existingOrder) {
        return existingOrder;
      }
    }

    throw new Error(`Failed to create order: ${error.message}`);
  }

  return orderFromRow(data as OrderRow);
}

export async function getRecentOrders() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return (data as OrderRow[]).map(orderFromRow);
}
