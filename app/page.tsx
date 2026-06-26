import { ProductExperience } from "@/components/product-experience";
import { getDailyProduct } from "@/lib/basepaint";
import { getActiveProduct } from "@/lib/mock-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const product = getActiveProduct() ?? (await getDailyProduct());

  return <ProductExperience product={product} />;
}
