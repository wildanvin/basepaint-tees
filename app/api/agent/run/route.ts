import { getDailyProduct } from "@/lib/basepaint";
import { ensurePrintifyProduct } from "@/lib/printify";
import { getProductByBasepaintDay, recordAgentRun, upsertDailyProduct } from "@/lib/product-store";
import { generatePrintAssets } from "@/lib/print-assets";
import { uploadGeneratedAssets } from "@/lib/supabase-assets";
import { requireAdminUser } from "@/lib/supabase-auth";

export async function POST() {
  try {
    const { isAdmin } = await requireAdminUser();

    if (!isAdmin) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const product = await getDailyProduct();
    const existingProduct = await getProductByBasepaintDay(product.basepaintDay);
    const productForSync = {
      ...product,
      shirtColor: existingProduct?.shirtColor ?? product.shirtColor,
    };
    const assetVersion = `sync-${Date.now()}`;
    await generatePrintAssets(productForSync);
    const assets = await uploadGeneratedAssets(productForSync.basepaintDay, assetVersion);
    const productWithAssets = {
      ...productForSync,
      ...assets,
      printifyProductId: existingProduct?.printifyProductId,
      printifyBlueprintId: existingProduct?.printifyBlueprintId,
      printifyPrintProviderId: existingProduct?.printifyPrintProviderId,
      printifyVariants: existingProduct?.printifyVariants,
    };
    const generatedProduct = await ensurePrintifyProduct({
      ...productWithAssets,
      statusMessage: `${product.statusMessage} Generated and uploaded print files and fallback mockups.`,
    });

    const storedProduct = await upsertDailyProduct(generatedProduct);

    const run = recordAgentRun({
      basepaintDay: storedProduct.basepaintDay,
      status: "success",
      message: `Upserted ${storedProduct.name} with Supabase assets.`,
      product: storedProduct,
    });
    const storedRun = await run;

    return Response.json({ ok: true, product: storedProduct, run: storedRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent error";
    let run;

    try {
      run = await recordAgentRun({
        basepaintDay: 0,
        status: "error",
        message,
      });
    } catch {
      run = undefined;
    }

    return Response.json({ ok: false, error: message, run }, { status: 500 });
  }
}
