import {
  getPersonalizedProducts,
  getProductDetail,
} from '@/features/product/api/productApi';
import { formatMoney } from '@/lib/utils/formatNumber';

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId } = await params;

  const [product, personalizedProducts] = await Promise.all([
    getProductDetail(productId),
    getPersonalizedProducts(),
  ]);

  const report = personalizedProducts.find(
    (item) => item.productId === Number(productId),
  );

  return (
    <div>
      <section className="px-6 pt-5 md:px-8 md:pt-12 lg:px-10 lg:pt-14">
        <div className="mt-4 rounded-[20px] bg-white p-5">
          <p className="font-bold text-[18px]">{product.name}</p>
          <p className="mt-3 whitespace-pre-line text-[#555] text-[14px]">
            {product.description}
          </p>

          {report && (
            <div className="mt-6 rounded-[16px] bg-[#F7F7F7] p-4">
              <p className="font-bold text-[16px]">맞춤 리포트</p>
              <p className="mt-2 whitespace-pre-line text-[#555] text-[14px]">
                {report.personalizedReport}
              </p>
              <p className="mt-3 text-[14px]">
                월 예상 혜택: {formatMoney(report.estimatedMonthlyBenefit)}
              </p>
              <p className="text-[14px]">
                연 예상 혜택: {formatMoney(report.estimatedAnnualBenefit)}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
