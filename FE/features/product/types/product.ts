export type ProductType =
  | 'INSURANCE'
  | 'SAVINGS'
  | 'CARD'
  | 'SUBSCRIPTION'
  | 'PET_FOREST';

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

export type PersonalizedProductReport = {
  productId: number;
  productName: string;
  productType: ProductType;
  recommendationType: ProductType;
  description: string;
  url: string;
  isActive: boolean;
  benefitRate?: number | null;
  benefitAmount?: number | null;
  benefitLimitAmount?: number | null;
  benefitLimitCount?: number | null;
  benefitPeriod?: BenefitPeriod | null;
  targetCategory?: string | null;
  sourceType?: SourceType | null;
  eligible: boolean;
  recommendedForFinanceReport: boolean;
  recommendationReason: string;
  personalizedReport: string;
  averageMonthlyExpense: number;
  hospitalExpense: number;
  foodExpense: number;
  hospitalVisitCount: number;
  estimatedMonthlyBenefit: number;
  estimatedAnnualBenefit: number;
};
