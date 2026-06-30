import Link from "next/link";
import type { DemoProduct } from "@/lib/demo-product";
import { AccountButton } from "@/components/account-button";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductDetails } from "@/components/product-details";

export function ProductExperience({
  product,
  productEthPrice,
}: {
  product: DemoProduct;
  productEthPrice?: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#171717]">
      <header className="border-b border-[#171717]/15 px-5 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="text-sm font-bold uppercase tracking-[0.18em]" href="/">
            BasePaint Tees
          </Link>
          <AccountButton />
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:py-12">
        <ProductCarousel product={product} />
        <ProductDetails product={product} productEthPrice={productEthPrice} />
      </section>
    </main>
  );
}
