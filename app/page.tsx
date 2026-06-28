import { ProductExperience } from "@/components/product-experience";
import { getDailyProduct } from "@/lib/basepaint";
import { getActiveProduct } from "@/lib/product-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const product = (await getActiveProduct().catch(() => undefined)) ?? (await getDailyProduct());

  return <ProductExperience product={product} />;
}
