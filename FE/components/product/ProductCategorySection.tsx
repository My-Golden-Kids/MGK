'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Product } from '@/features/product/types/product';

type ProductCategorySectionProps = {
  products: Product[];
};

export default function ProductCategorySection({
  products,
}: ProductCategorySectionProps) {
  const pathname = usePathname();

  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2 md:gap-2.5 lg:gap-3">
      {products.map((product) => {
        const isSelected = pathname === `/product/${product.id}`;

        return (
          <div key={product.id} className="flex w-2/7 justify-center">
            <Link
              href={`/product/${product.id}`}
              className={`w-fit whitespace-nowrap rounded-[14px] border p-2 text-[18px] leading-none transition md:p-2.5 md:text-[22px] lg:p-3 lg:text-[26px] ${
                isSelected
                  ? 'border-2 border-[var(--color-mint-green)] bg-white font-bold'
                  : 'border border-[#CCCCCC] bg-white font-normal'
              }`}
            >
              {product.name}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
