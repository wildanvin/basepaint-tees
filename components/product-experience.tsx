import type { DemoProduct } from "@/lib/demo-product";
import { AccountButton } from "@/components/account-button";
import { BrandLogo } from "@/components/brand-logo";
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
    <main className="min-h-screen bg-[#050608] text-white">
      <header className="border-b border-white/10 bg-[#090a0c] px-5 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <BrandLogo />
          <AccountButton tone="dark" />
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:py-12">
        <ProductCarousel product={product} />
        <ProductDetails product={product} productEthPrice={productEthPrice} />
      </section>
    </main>
  );
}
