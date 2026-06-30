import { ProductExperience } from "@/components/product-experience";
import { createEstimatedCheckoutQuote } from "@/lib/base-payments";
import { getDailyProduct } from "@/lib/basepaint";
import { getActiveProduct } from "@/lib/product-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const product = (await getActiveProduct().catch(() => undefined)) ?? (await getDailyProduct());
  const productEthPrice = await createEstimatedCheckoutQuote({
    priceCents: product.priceCents,
  }).catch(() => undefined);

  return <ProductExperience product={product} productEthPrice={productEthPrice?.displayAmountEth} />;
}
