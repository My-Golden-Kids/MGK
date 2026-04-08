import { getProductDetail } from '@/features/product/api/productApi';

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId } = await params;
  const product = await getProductDetail(productId);

  return (
    <div>
      <section className="px-6 pt-5 md:px-8 md:pt-12 lg:px-10 lg:pt-14">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-[#C9C9C9]" />
          <h2 className="shrink-0 font-bold text-[18px] text-black leading-none md:text-[20px] lg:text-[22px]">
            {product.name}
          </h2>
          <div className="h-px flex-1 bg-[#C9C9C9]" />
        </div>

        <div className="mt-4 rounded-[20px] bg-white p-5 md:mt-5 md:p-6">
          <p className="font-bold text-[18px] text-black md:text-[20px] lg:text-[22px]">
            {product.name}
          </p>

          <p className="mt-3 whitespace-pre-line text-[#555555] text-[14px] leading-relaxed md:text-[16px] lg:text-[18px]">
            {product.description}
          </p>
        </div>
      </section>
    </div>
  );
}
