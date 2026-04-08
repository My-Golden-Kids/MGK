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
          <div key={product.id} className="flex w-1/4 justify-center">
            <Link
              href={`/product/${product.id}`}
              className={`w-fit whitespace-nowrap rounded-[14px] border p-2 text-[16px] leading-none transition md:p-2.5 md:text-[18px] lg:p-3 lg:text-[20px] ${
                isSelected
                  ? 'border-[var(--color-mint-green)] bg-white font-bold'
                  : 'border-[#CCCCCC] bg-white font-normal'
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
