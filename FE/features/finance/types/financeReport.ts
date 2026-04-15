import type { PersonalizedProductReport } from '@/features/product/types/product';

export type FinanceDominantCategory = {
  category: 'Hospital' | 'Food' | 'Etc';
  categoryLabel: string;
  amount: number;
  percent: number;
};

export type FinanceRetirementReport = {
  totalPetCost: number;
  retirementPercent: number;
  averageExpense: number;
  totalAsset: number;
  dominantCategory?: FinanceDominantCategory | null;
  recommendedProduct?: PersonalizedProductReport | null;
};

export type MonthlyExpenseItem = {
  month: string;
  amount: number;
};

export type MonthlyExpenseChartResponse = {
  monthlyExpenses: MonthlyExpenseItem[];
};
