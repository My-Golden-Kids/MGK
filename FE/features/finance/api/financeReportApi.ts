import { clientFetch } from '@/lib/client-fetch';
import { getStoredSelectedPetId } from '@/lib/medical-record';
import type {
  FinanceRetirementReport,
  MonthlyExpenseChartResponse,
} from '../types/financeReport';

const EMPTY_REPORT: FinanceRetirementReport = {
  totalPetCost: 0,
  retirementPercent: 0,
  averageExpense: 0,
  totalAsset: 0,
};

function createEmptyMonthlyChart(): MonthlyExpenseChartResponse {
  const now = new Date();

  return {
    monthlyExpenses: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);

      return {
        month: `${date.getMonth() + 1}월`,
        amount: 0,
      };
    }),
  };
}

export async function getFinanceRetirementReport(): Promise<FinanceRetirementReport> {
  try {
    const petId = getStoredSelectedPetId();
    const query = petId != null ? `?petId=${petId}` : '';
    const res = await clientFetch(`/api/finance/report${query}`);

    if (!res.ok) {
      return EMPTY_REPORT;
    }

    return (await res.json()) as FinanceRetirementReport;
  } catch {
    return EMPTY_REPORT;
  }
}

export async function getMonthlyExpenseChart(): Promise<MonthlyExpenseChartResponse> {
  try {
    const res = await clientFetch('/api/finance/report/monthly-expenses');

    if (!res.ok) {
      return createEmptyMonthlyChart();
    }

    return (await res.json()) as MonthlyExpenseChartResponse;
  } catch {
    return createEmptyMonthlyChart();
  }
}
