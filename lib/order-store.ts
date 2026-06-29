import "server-only";

import type { ShirtSize } from "@/lib/demo-product";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type ShippingAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "simulated_fulfillment"
  | "printful_draft_created"
  | "printful_confirmed"
  | "printify_order_created"
  | "printify_sent_to_production"
  | "fulfillment_failed"
  | "expired"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "confirmed" | "expired" | "failed";

export type OrderRecord = {
  id: string;
  dailyProductId: string | null;
  fulfillmentOrderId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  shipping: ShippingAddress | null;
  size: ShirtSize;
  status: OrderStatus;
  fulfillmentMode: string;
  fulfillmentProvider: string;
  fulfillmentPayload: unknown;
  shippingCostCents: number | null;
  totalPriceCents: number | null;
  printifyVariantId: number | null;
  printifyBlueprintId: number | null;
  printifyPrintProviderId: number | null;
  printifyShippingMethod: number | null;
  paymentReference: string | null;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  chainId: number | null;
  receiverAddress: string | null;
  expectedAmountWei: string | null;
  displayAmountEth: string | null;
  ethUsdPrice: string | null;
  receivedAmountWei: string | null;
  payerAddress: string | null;
  paymentTxHash: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  fulfillmentError: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  id: string;
  daily_product_id: string | null;
  fulfillment_order_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_json: ShippingAddress | null;
  size: string;
  status: string;
  fulfillment_mode: string;
  fulfillment_provider: string | null;
  fulfillment_payload: unknown;
  shipping_cost_cents: number | null;
  total_price_cents: number | null;
  printify_variant_id: number | null;
  printify_blueprint_id: number | null;
  printify_print_provider_id: number | null;
  printify_shipping_method: number | null;
  payment_reference: string | null;
  payment_method: string | null;
  payment_status: string | null;
  chain_id: number | null;
  receiver_address: string | null;
  expected_amount_wei: string | null;
  display_amount_eth: string | null;
  eth_usd_price: string | null;
  received_amount_wei: string | null;
  payer_address: string | null;
  payment_tx_hash: string | null;
  paid_at: string | null;
  expires_at: string | null;
  fulfillment_error: string | null;
  created_at: string;
  updated_at: string;
};

type CreatePaymentOrderInput = {
  dailyProductId: string;
  customerEmail: string;
  customerName: string;
  shipping: ShippingAddress;
  size: ShirtSize;
  fulfillmentMode: string;
  paymentReference: string;
  chainId: number;
  receiverAddress: string;
  expectedAmountWei: string;
  displayAmountEth: string;
  ethUsdPrice: string;
  expiresAt: string;
  shippingCostCents: number;
  totalPriceCents: number;
  printifyVariantId: number;
  printifyBlueprintId: number;
  printifyPrintProviderId: number;
  printifyShippingMethod: number;
};

type UpdateOrderFulfillmentInput = {
  orderId: string;
  status: OrderStatus;
  fulfillmentOrderId?: string | null;
  fulfillmentPayload?: unknown;
  fulfillmentError?: string | null;
};

type ConfirmPaymentInput = {
  orderId: string;
  txHash: string;
  payerAddress: string;
  receivedAmountWei: string;
};

export type PaymentEventInput = {
  txHash: string;
  fromAddress: string | null;
  toAddress: string | null;
  amountWei: string | null;
  matchedOrderId?: string | null;
  source: "alchemy_webhook" | "alchemy_poll";
  rawPayload: unknown;
};

function orderFromRow(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    dailyProductId: row.daily_product_id,
    fulfillmentOrderId: row.fulfillment_order_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    shipping: row.shipping_json,
    size: row.size as ShirtSize,
    status: row.status as OrderStatus,
    fulfillmentMode: row.fulfillment_mode,
    fulfillmentProvider: row.fulfillment_provider ?? "printify",
    fulfillmentPayload: row.fulfillment_payload,
    shippingCostCents: row.shipping_cost_cents,
    totalPriceCents: row.total_price_cents,
    printifyVariantId: row.printify_variant_id,
    printifyBlueprintId: row.printify_blueprint_id,
    printifyPrintProviderId: row.printify_print_provider_id,
    printifyShippingMethod: row.printify_shipping_method,
    paymentReference: row.payment_reference,
    paymentMethod: row.payment_method,
    paymentStatus: (row.payment_status ?? "pending") as PaymentStatus,
    chainId: row.chain_id,
    receiverAddress: row.receiver_address,
    expectedAmountWei: row.expected_amount_wei,
    displayAmountEth: row.display_amount_eth,
    ethUsdPrice: row.eth_usd_price,
    receivedAmountWei: row.received_amount_wei,
    payerAddress: row.payer_address,
    paymentTxHash: row.payment_tx_hash,
    paidAt: row.paid_at,
    expiresAt: row.expires_at,
    fulfillmentError: row.fulfillment_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getFulfillmentMode() {
  return process.env.FULFILLMENT_MODE ?? "mock";
}

export async function createPaymentOrder(input: CreatePaymentOrderInput) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      daily_product_id: input.dailyProductId,
      fulfillment_order_id: null,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      shipping_json: input.shipping,
      size: input.size,
      status: "pending_payment",
      fulfillment_mode: input.fulfillmentMode,
      fulfillment_provider: input.fulfillmentMode === "mock" ? "mock" : "printify",
      fulfillment_payload: null,
      shipping_cost_cents: input.shippingCostCents,
      total_price_cents: input.totalPriceCents,
      printify_variant_id: input.printifyVariantId,
      printify_blueprint_id: input.printifyBlueprintId,
      printify_print_provider_id: input.printifyPrintProviderId,
      printify_shipping_method: input.printifyShippingMethod,
      payment_reference: input.paymentReference,
      payment_method: "base_eth",
      payment_status: "pending",
      chain_id: input.chainId,
      receiver_address: input.receiverAddress.toLowerCase(),
      expected_amount_wei: input.expectedAmountWei,
      display_amount_eth: input.displayAmountEth,
      eth_usd_price: input.ethUsdPrice,
      expires_at: input.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create payment order: ${error.message}`);
  }

  return orderFromRow(data as OrderRow);
}

export async function getOrderById(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  return data ? orderFromRow(data as OrderRow) : undefined;
}

export async function getOrderByPaymentReference(paymentReference: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_reference", paymentReference)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  return data ? orderFromRow(data as OrderRow) : undefined;
}

export async function getPendingOrderByExpectedPayment({
  receiverAddress,
  expectedAmountWei,
}: {
  receiverAddress: string;
  expectedAmountWei: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("receiver_address", receiverAddress.toLowerCase())
    .eq("expected_amount_wei", expectedAmountWei)
    .eq("payment_status", "pending")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to match payment order: ${error.message}`);
  }

  return data ? orderFromRow(data as OrderRow) : undefined;
}

export async function getOrderByPaymentTx(txHash: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_tx_hash", txHash.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order by tx: ${error.message}`);
  }

  return data ? orderFromRow(data as OrderRow) : undefined;
}

export async function markOrderPaid(input: ConfirmPaymentInput) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "confirmed",
      payment_tx_hash: input.txHash.toLowerCase(),
      payer_address: input.payerAddress.toLowerCase(),
      received_amount_wei: input.receivedAmountWei,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", input.orderId)
    .eq("payment_status", "pending")
    .select("*")
    .single();

  if (error) {
    const existing = await getOrderByPaymentTx(input.txHash);

    if (existing) {
      return existing;
    }

    throw new Error(`Failed to mark order paid: ${error.message}`);
  }

  return orderFromRow(data as OrderRow);
}

export async function updateOrderFulfillment(input: UpdateOrderFulfillmentInput) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: input.status,
      fulfillment_order_id: input.fulfillmentOrderId ?? null,
      fulfillment_payload: input.fulfillmentPayload ?? null,
      fulfillment_error: input.fulfillmentError ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update order fulfillment: ${error.message}`);
  }

  return orderFromRow(data as OrderRow);
}

export async function recordPaymentEvent(input: PaymentEventInput) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("payment_events").upsert(
    {
      tx_hash: input.txHash.toLowerCase(),
      from_address: input.fromAddress?.toLowerCase() ?? null,
      to_address: input.toAddress?.toLowerCase() ?? null,
      amount_wei: input.amountWei,
      matched_order_id: input.matchedOrderId ?? null,
      source: input.source,
      raw_payload: input.rawPayload,
    },
    { onConflict: "tx_hash" },
  );

  if (error) {
    throw new Error(`Failed to record payment event: ${error.message}`);
  }
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
