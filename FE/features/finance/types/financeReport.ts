export type FinanceRetirementReport = {
  totalPetCost: number;
  retirementPercent: number;
  averageExpense: number;
  totalAsset: number;
};

export type MonthlyExpenseItem = {
  month: string;
  amount: number;
};

export type MonthlyExpenseChartResponse = {
  monthlyExpenses: MonthlyExpenseItem[];
};
