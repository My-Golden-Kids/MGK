import type { PersonalizedProductReport } from '@/features/product/types/product';

export type FinanceRetirementReport = {
  totalPetCost: number;
  retirementPercent: number;
  averageExpense: number;
  totalAsset: number;
  recommendedProduct?: PersonalizedProductReport | null;
};

export type MonthlyExpenseItem = {
  month: string;
  amount: number;
};

export type MonthlyExpenseChartResponse = {
  monthlyExpenses: MonthlyExpenseItem[];
};
