import { getDailyProduct } from "@/lib/basepaint";
import { recordAgentRun, upsertDailyProduct } from "@/lib/product-store";
import { generatePrintAssets } from "@/lib/print-assets";
import { createPrintfulMockups } from "@/lib/printful";
import {
  uploadGeneratedAssets,
  uploadPrintfulMockups,
} from "@/lib/supabase-assets";

export async function POST() {
  try {
    const product = await getDailyProduct();
    const assetVersion = `sync-${Date.now()}`;
    await generatePrintAssets(product);
    const assets = await uploadGeneratedAssets(product.basepaintDay, assetVersion);
    const productWithAssets = {
      ...product,
      ...assets,
    };
    let generatedProduct = {
      ...productWithAssets,
      statusMessage: `${product.statusMessage} Generated and uploaded print files and fallback mockups.`,
    };

    try {
      const printfulMockups = await createPrintfulMockups(productWithAssets);
      const uploadedPrintfulMockups = await uploadPrintfulMockups(
        product.basepaintDay,
        printfulMockups,
        assetVersion,
      );

      generatedProduct = {
        ...generatedProduct,
        ...uploadedPrintfulMockups,
        statusMessage: `${product.statusMessage} Generated Printful mockups via task ${printfulMockups.taskKey}.`,
      };
    } catch (mockupError) {
      const message =
        mockupError instanceof Error ? mockupError.message : "Unknown Printful error";

      generatedProduct.statusMessage = `${generatedProduct.statusMessage} Printful mockup generation failed: ${message}`;
    }

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
