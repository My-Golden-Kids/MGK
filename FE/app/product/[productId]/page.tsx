import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  getPersonalizedProducts,
  getProductDetail,
} from '@/features/product/api/productApi';
import type {
  PersonalizedProductReport,
  ProductType,
} from '@/features/product/types/product';
import { formatMoney } from '@/lib/utils/formatNumber';

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>;
};

function getProductImageSrc(productType: ProductType) {
  switch (productType) {
    case 'INSURANCE':
      return '/images/product/img_pet_insurance.png';
    case 'CARD':
      return '/images/product/img_pet_card.png';
    case 'SAVINGS':
      return '/images/product/img_pet_savings.png';
    case 'SUBSCRIPTION':
      return '/images/product/img_pet_subscription.png';
    case 'PET_FOREST':
      return '/images/product/img_pet_forest.png';
  }
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-[#CCCCCC] bg-white p-4 md:rounded-[15px] md:p-5 lg:rounded-[16px] lg:p-6">
      <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#D4F4F0] text-[18px] md:h-9 md:w-9 md:text-[20px] lg:h-10 lg:w-10 lg:text-[22px]">
          {icon}
        </div>
        <h3 className="font-bold text-[18px] md:text-[22px] lg:text-[26px]">
          {title}
        </h3>
      </div>
      <div className="mt-4 md:mt-4.5 lg:mt-5">{children}</div>
    </section>
  );
}

function InsuranceReport({ report }: { report: PersonalizedProductReport }) {
  return (
    <>
      <SectionCard
        title="병원 이용 분석"
        icon={
          <img
            src="/images/product/icon_hospital.png"
            alt="병원 아이콘"
            className="h-[18px] w-[18px] object-contain md:h-[20px] md:w-[20px] lg:h-[22px] lg:w-[22px]"
          />
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[12px] bg-[#D4F4F0] px-3 py-4 text-center">
            <p className="font-bold text-[15px] text-black leading-snug">
              방문한 횟수
            </p>
            <p className="mt-5 font-extrabold text-[24px] text-[var(--color-main-green)]">
              {report.hospitalVisitCount}번
            </p>
          </div>
          <div className="rounded-[12px] bg-[#D4F4F0] px-3 py-4 text-center">
            <p className="font-bold text-[15px] text-black leading-snug">
              보험 가입 시
              <br />
              예상 절감액
            </p>
            <p className="mt-5 font-extrabold text-[20px] text-[var(--color-main-green)]">
              연 {formatMoney(report.estimatedAnnualBenefit)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="최대 보장 혜택"
        icon={
          <img
            src="/images/product/icon_benefit.png"
            alt="혜택 아이콘"
            className="h-[18px] w-[18px] object-contain md:h-[20px] md:w-[20px] lg:h-[22px] lg:w-[22px]"
          />
        }
      >
        <div className="rounded-[12px] bg-[#D4F4F0] px-4 py-4">
          <p className="font-bold text-[16px] text-black leading-snug">
            <span className="text-[var(--color-main-green)]">
              {report.productName}
            </span>
            은 연{' '}
            <span className="text-[#FF4D4F]">
              최대 {formatMoney(report.benefitLimitAmount ?? 0)}
            </span>
            까지 보장 혜택을 받을 수 있어요.
          </p>
        </div>
        <p className="mt-3 text-[#555555] text-[13px]">
          보험 가입 시 병원비 부담을 크게 줄일 수 있어요.
        </p>
      </SectionCard>
    </>
  );
}

function CardReport({ report }: { report: PersonalizedProductReport }) {
  return (
    <SectionCard
      title="최대 보장 혜택"
      icon={
        <img
          src="/images/product/icon_benefit.png"
          alt="혜택 아이콘"
          className="h-[18px] w-[18px] object-contain md:h-[20px] md:w-[20px] lg:h-[22px] lg:w-[22px]"
        />
      }
    >
      <div className="rounded-[12px] bg-[#D4F4F0] px-4 py-4">
        <p className="font-bold text-[16px] text-black leading-snug">
          <span className="text-[var(--color-main-green)]">
            {report.productName}
          </span>
          를 사용하시면 매달 평균{' '}
          <span className="text-[var(--color-main-green)]">
            {formatMoney(report.estimatedMonthlyBenefit)}
          </span>
          을 절약하실 수 있어요.
          <br />
          또한, 연{' '}
          <span className="text-[#FF4D4F]">
            최대 {formatMoney(report.benefitLimitAmount ?? 0)}
          </span>
          까지 보장 혜택을 받을 수 있어요.
        </p>
      </div>
      <p className="mt-3 text-[#555555] text-[13px]">
        사용처 : 동물병원, 펫용품 구매, 사료 구입
      </p>
    </SectionCard>
  );
}

function SavingsReport({ report }: { report: PersonalizedProductReport }) {
  return (
    <SectionCard
      title="최대 보장 혜택"
      icon={
        <img
          src="/images/product/icon_benefit.png"
          alt="혜택 아이콘"
          className="h-[18px] w-[18px] object-contain md:h-[20px] md:w-[20px] lg:h-[22px] lg:w-[22px]"
        />
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[12px] bg-[#D4F4F0] px-3 py-4 text-center">
          <p className="font-bold text-[#FF4D4F] text-[15px] leading-snug">
            연 최대 이자
          </p>
          <p className="mt-3 font-extrabold text-[#FF4D4F] text-[28px]">
            {formatMoney(report.estimatedAnnualBenefit)}
          </p>
        </div>
        <div className="rounded-[12px] bg-[#D4F4F0] px-3 py-4 text-center">
          <p className="mt-4 font-extrabold text-[#FF4D4F] text-[24px] leading-tight">
            보험
            <br />
            무료 가입
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-[#555555] text-[13px]">
        <p>매달 50만원 저축 시 최대 이자 혜택 적용</p>
        <p>보험 무료 가입 및 부가 혜택 적용 가능</p>
      </div>
    </SectionCard>
  );
}

function SubscriptionReport({ report }: { report: PersonalizedProductReport }) {
  return (
    <SectionCard
      title="최대 보장 혜택"
      icon={
        <img
          src="/images/product/icon_benefit.png"
          alt="혜택 아이콘"
          className="h-[18px] w-[18px] object-contain md:h-[20px] md:w-[20px] lg:h-[22px] lg:w-[22px]"
        />
      }
    >
      <div className="rounded-[12px] bg-[#D4F4F0] px-4 py-4">
        <p className="font-bold text-[16px] text-black leading-snug">
          <span className="text-[var(--color-main-green)]">
            {report.productName}
          </span>{' '}
          구독은 매달{' '}
          <span className="text-[#FF4D4F]">
            최소{' '}
            {formatMoney(
              report.benefitAmount ?? report.estimatedMonthlyBenefit,
            )}
          </span>
          의 비용을 절약하고 다양한 혜택을 받을 수 있어요.
        </p>
      </div>
      <p className="mt-3 text-[#555555] text-[13px]">
        사료 할인, 최소 기준 펫보험, 건강관리 지원
      </p>
    </SectionCard>
  );
}

function ForestReport({ report }: { report: PersonalizedProductReport }) {
  return (
    <SectionCard
      title="최대 보장 혜택"
      icon={
        <img
          src="/images/product/icon_benefit.png"
          alt="혜택 아이콘"
          className="h-[18px] w-[18px] object-contain md:h-[20px] md:w-[20px] lg:h-[22px] lg:w-[22px]"
        />
      }
    >
      <div className="rounded-[12px] bg-[#D4F4F0] px-4 py-4">
        <p className="font-bold text-[16px] text-black leading-snug">
          반려동물 장례 전문업체{' '}
          <span className="text-[var(--color-main-green)]">펫포레스트</span> 와
          제휴를 통해{' '}
          <span className="text-[#FF4D4F]">
            {report.benefitRate?.toFixed(0)}% 할인
          </span>{' '}
          쿠폰을 제공받을 수 있어요.
        </p>
      </div>
    </SectionCard>
  );
}

function ProductReportBody({ report }: { report: PersonalizedProductReport }) {
  switch (report.productType) {
    case 'INSURANCE':
      return <InsuranceReport report={report} />;
    case 'CARD':
      return <CardReport report={report} />;
    case 'SAVINGS':
      return <SavingsReport report={report} />;
    case 'SUBSCRIPTION':
      return <SubscriptionReport report={report} />;
    case 'PET_FOREST':
      return <ForestReport report={report} />;
  }
}

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
  const imageSrc = getProductImageSrc(product.productType);

  return (
    <div className="py-6 md:py-7 lg:py-8">
      <section className="mx-auto px-6 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#CCCCCC]" />
          <h2 className="shrink-0 text-center font-bold text-[20px] md:text-[24px] lg:text-[28px]">
            {product.name}
          </h2>
          <div className="h-px flex-1 bg-[#CCCCCC]" />
        </div>

        {report ? (
          <div className="mt-6 space-y-3 md:mt-7 lg:mt-8">
            <ProductReportBody report={report} />
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden bg-white md:mt-6 lg:mt-7">
          <Image
            src={imageSrc}
            alt={`${product.name} 안내 이미지`}
            width={420}
            height={680}
            className="h-auto w-full"
            priority
          />
        </div>

        {report ? (
          <Button
            className="mt-5 h-auto w-full rounded-[16px] bg-[#00A389] p-2 font-bold text-[28px] text-white hover:bg-[#008f78] md:mt-6 md:p-2.5 md:text-[32px] lg:mt-7 lg:p-3 lg:text-[36px]"
            asChild
          >
            <a href={report.url} target="_blank" rel="noreferrer">
              상품 자세히 보기
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            disabled
            className="mt-5 h-auto w-full rounded-[16px] bg-[#BFC9C8] p-2 font-bold text-[28px] text-white md:mt-6 md:p-2.5 md:text-[32px] lg:mt-7 lg:p-3 lg:text-[36px]"
          >
            가입한 상품
          </Button>
        )}
      </section>
    </div>
  );
}
