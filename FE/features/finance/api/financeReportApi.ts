import type {
  FinanceRetirementReport,
  MonthlyExpenseChartResponse,
} from '../types/financeReport';

const BASE_URL = process.env.NEXT_PUBLIC_SPRING_API_URL;

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_SPRING_API_URL 환경변수가 설정되지 않았습니다.');
}

export async function getFinanceRetirementReport(
  userId: number,
): Promise<FinanceRetirementReport> {
  const res = await fetch(`${BASE_URL}/api/finance/report?userId=${userId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `금융 리포트 조회 실패: ${res.status} ${res.statusText} - ${errorText}`,
    );
  }

  return res.json();
}

export async function getMonthlyExpenseChart(
  userId: number,
): Promise<MonthlyExpenseChartResponse> {
  const res = await fetch(
    `${BASE_URL}/api/finance/report/monthly-expenses?userId=${userId}`,
    {
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `월별 지출 차트 조회 실패: ${res.status} ${res.statusText} - ${errorText}`,
    );
  }

  return res.json();
}
