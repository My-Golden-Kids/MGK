'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import CouponCard, {
  type CouponBadgeType,
  type CouponStatus,
} from '@/components/home/coupon/CouponCard';

type CouponItem = {
  id: number;
  categoryLabel: string;
  title: string;
  value: string;
  badgeType: CouponBadgeType;
  status: CouponStatus;
};

const couponList: CouponItem[] = [
  {
    id: 1,
    categoryLabel: 'VIP 쿠폰',
    title: '펫 포레스트 20% 할인',
    value: '20%',
    badgeType: 'discount',
    status: 'available',
  },
  {
    id: 2,
    categoryLabel: '구독 쿠폰',
    title: '펫쇼핑몰 할인 쿠폰',
    value: '5,000원',
    badgeType: 'discount',
    status: 'available',
  },
  {
    id: 3,
    categoryLabel: '구독 쿠폰',
    title: '반려동물 건강분석',
    value: '무료',
    badgeType: 'free',
    status: 'available',
  },
  {
    id: 4,
    categoryLabel: '구독 쿠폰',
    title: '반려동물 매거진',
    value: '무료',
    badgeType: 'free',
    status: 'used',
  },
];

type TabType = 'available' | 'used';

export default function CouponPage() {
  const [activeTab, setActiveTab] = useState<TabType>('available');

  const filteredCoupons = useMemo(() => {
    return couponList.filter((coupon) => coupon.status === activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh w-full flex-col bg-white">
        <header className="px-6 pt-5 md:px-7 lg:px-8">
          <div className="relative flex items-center justify-center">
            <Link
              href="/product"
              className="absolute left-0 font-medium text-[24px] md:text-[28px] lg:text-[32px]"
            >
              뒤로
            </Link>

            <h1 className="font-bold text-[28px] text-[var(--color-main-green)] md:text-[32px] lg:text-[36px]">
              쿠폰
            </h1>
          </div>
        </header>

        <section className="mt-10 md:mt-11 lg:mt-12">
          <div className="grid grid-cols-2 border-[#CCCCCC] border-b">
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`pb-3 text-center font-medium text-[20px] md:text-[24px] lg:text-[28px] ${
                activeTab === 'available'
                  ? 'border-[var(--color-main-green)] border-b-2 text-[var(--color-main-green)]'
                  : 'text-black'
              }`}
            >
              사용 가능
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('used')}
              className={`pb-3 text-center font-medium text-[20px] md:text-[24px] lg:text-[28px] ${
                activeTab === 'used'
                  ? 'border-[var(--color-main-green)] border-b-2 text-[var(--color-main-green)]'
                  : 'text-black'
              }`}
            >
              사용 완료
            </button>
          </div>
        </section>

        <main className="flex-1 px-5 py-7 md:px-6 md:py-8 lg:px-7 lg:py-9">
          <div className="space-y-5">
            {filteredCoupons.length > 0 ? (
              filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  categoryLabel={coupon.categoryLabel}
                  title={coupon.title}
                  value={coupon.value}
                  badgeType={coupon.badgeType}
                  status={coupon.status}
                  onClick={() => {
                    console.log('coupon clicked:', coupon.id);
                  }}
                />
              ))
            ) : (
              <div className="pt-10 text-center text-[#808080] text-[16px] md:pt-11 md:text-[20px] lg:pt-12 lg:text-[24px]">
                표시할 쿠폰이 없습니다.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
