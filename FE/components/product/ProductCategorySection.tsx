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
  const firstRowProducts = products.slice(0, 2);
  const secondRowProducts = products.slice(2, 5);

  const renderProductButton = (product: Product, widthClass?: string) => {
    const isSelected = pathname === `/product/${product.id}`;

    return (
      <Link
        href={`/product/${product.id}`}
        className={`flex min-h-[44px] min-w-0 items-center justify-center rounded-[14px] border px-3 py-2 text-center text-[18px] leading-none transition md:min-h-[52px] md:px-3.5 md:py-2.5 md:text-[22px] lg:min-h-[60px] lg:px-4 lg:py-3 lg:text-[26px] ${widthClass ?? 'w-full'} ${
          isSelected
            ? 'border-2 border-[var(--color-mint-green)] bg-white font-bold'
            : 'border border-[#CCCCCC] bg-white font-normal'
        }`}
      >
        <span className="truncate whitespace-nowrap">{product.name}</span>
      </Link>
    );
  };

  return (
    <div className="mt-5 px-5 md:px-6 lg:px-7">
      <div className="flex flex-col gap-2 md:gap-2.5 lg:gap-3">
        <div className="mx-auto grid grid-cols-2 justify-center gap-2 md:gap-2.5 lg:gap-3">
          {firstRowProducts.map((product) => (
            <div key={product.id} className="w-full max-w-[148px] md:max-w-[186px] lg:max-w-[224px]">
              {renderProductButton(product, 'w-full')}
            </div>
          ))}
        </div>

        <div className="grid w-full grid-cols-3 gap-2 md:gap-2.5 lg:gap-3">
          {secondRowProducts.map((product) => (
            <div key={product.id}>{renderProductButton(product)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
