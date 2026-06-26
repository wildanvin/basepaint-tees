import { getDailyProduct } from "@/lib/basepaint";
import { recordAgentRun, upsertDailyProduct } from "@/lib/mock-store";

export async function POST() {
  try {
    const product = await getDailyProduct();
    upsertDailyProduct(product);

    const run = recordAgentRun({
      basepaintDay: product.basepaintDay,
      status: "success",
      message: `Upserted ${product.name}.`,
      product,
    });

    return Response.json({ ok: true, product, run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent error";
    const run = recordAgentRun({
      basepaintDay: 0,
      status: "error",
      message,
    });

    return Response.json({ ok: false, error: message, run }, { status: 500 });
  }
}
