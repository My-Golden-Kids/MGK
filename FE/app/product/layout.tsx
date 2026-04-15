import { BottomNavigation } from '@/components/common/BottomNavigation';
import ProductCategorySection from '@/components/product/ProductCategorySection';
import { getProducts } from '@/features/product/api/productApi';

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await getProducts();

  return (
    <div className="h-dvh overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-[420px] flex-col overflow-hidden md:max-w-[500px] lg:max-w-[640px]">
        <section className="shrink-0 pt-5">
          <h1 className="text-center font-bold text-[28px] text-[var(--color-main-green)] md:text-[32px] lg:text-[36px]">
            상품
          </h1>

          <ProductCategorySection products={products} />
        </section>

        <section className="scrollbar-hide mt-5 min-h-0 flex-1 overflow-y-auto md:mt-6 lg:mt-7">
          {children}
        </section>

        <div className="shrink-0">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}
