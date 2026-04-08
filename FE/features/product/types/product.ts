export type ProductType = 'INSURANCE' | 'SAVINGS' | 'CARD';

export type BenefitPeriod = 'MONTH' | 'YEAR';

export type SourceType = 'ACCOUNT_BOOK' | 'ACCOUNT';

export type Product = {
  id: number;
  name: string;
  productType: ProductType;
  description: string;
  benefitRate?: number | null;
  benefitAmount?: number | null;
  benefitLimitAmount?: number | null;
  benefitLimitCount?: number | null;
  benefitPeriod?: BenefitPeriod | null;
  targetCategory?: string | null;
  sourceType?: SourceType | null;
  isActive: boolean;
};
