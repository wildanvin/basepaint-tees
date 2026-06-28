import "server-only";

import type { DemoProduct } from "@/lib/demo-product";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type AgentRun = {
  id: string;
  basepaintDay: number;
  status: "success" | "error";
  message: string;
  product?: DemoProduct;
  createdAt: string;
};

type DailyProductRow = {
  id: string;
  basepaint_day: number;
  theme: string | null;
  art_url: string;
  art_storage_path: string | null;
  palette_json: string[] | null;
  palette_color: string | null;
  shirt_color: string;
  front_print_url: string;
  back_print_url: string;
  mockup_front_url: string | null;
  mockup_back_url: string | null;
  price_cents: number;
  currency: string;
  status: string;
};

type AgentRunRow = {
  id: string;
  basepaint_day: number | null;
  status: string;
  message: string | null;
  logs: {
    product?: DemoProduct;
  } | null;
  created_at: string;
};

function productFromRow(row: DailyProductRow): DemoProduct {
  const theme = row.theme ?? `Day ${row.basepaint_day}`;

  return {
    id: row.id,
    basepaintDay: row.basepaint_day,
    theme,
    name: `BasePaint #${row.basepaint_day} Tee`,
    priceCents: row.price_cents,
    currency: row.currency.toUpperCase() === "USD" ? "USD" : "USD",
    shirtColor: row.shirt_color,
    palette: Array.isArray(row.palette_json) ? row.palette_json : [],
    sizes: ["S", "M", "L", "XL", "2XL"],
    artUrl: row.art_url,
    frontPrintText: [`BasePaint #${row.basepaint_day}`, theme],
    frontPrintUrl: row.front_print_url,
    backPrintUrl: row.back_print_url,
    mockupFrontUrl: row.mockup_front_url ?? undefined,
    mockupBackUrl: row.mockup_back_url ?? undefined,
    dataSource: "live",
    statusMessage: "Loaded from Supabase.",
  };
}

function agentRunFromRow(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    basepaintDay: row.basepaint_day ?? 0,
    status: row.status === "success" ? "success" : "error",
    message: row.message ?? "",
    product: row.logs?.product,
    createdAt: row.created_at,
  };
}

export async function getActiveProduct() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("daily_products")
    .select("*")
    .eq("status", "active")
    .order("basepaint_day", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load active product: ${error.message}`);
  }

  return data ? productFromRow(data as DailyProductRow) : undefined;
}

export async function upsertDailyProduct(product: DemoProduct) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("daily_products")
    .upsert(
      {
        basepaint_day: product.basepaintDay,
        theme: product.theme,
        art_url: product.artUrl,
        art_storage_path: null,
        palette_json: product.palette,
        palette_color: product.palette[0] ?? null,
        shirt_color: product.shirtColor,
        front_print_url: product.frontPrintUrl,
        back_print_url: product.backPrintUrl,
        mockup_front_url: product.mockupFrontUrl ?? null,
        mockup_back_url: product.mockupBackUrl ?? null,
        price_cents: product.priceCents,
        currency: product.currency.toLowerCase(),
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "basepaint_day" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert daily product: ${error.message}`);
  }

  return productFromRow(data as DailyProductRow);
}

export async function recordAgentRun(run: {
  basepaintDay: number;
  status: "success" | "error";
  message: string;
  product?: DemoProduct;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_runs")
    .insert({
      basepaint_day: run.basepaintDay || null,
      status: run.status,
      message: run.message,
      logs: run.product ? { product: run.product } : null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to record agent run: ${error.message}`);
  }

  return agentRunFromRow(data as AgentRunRow);
}

export async function getRecentAgentRuns() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to load agent runs: ${error.message}`);
  }

  return (data as AgentRunRow[]).map(agentRunFromRow);
}
