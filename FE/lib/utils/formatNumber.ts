export function formatMoney(value: number): string {
  if (!value || value <= 0) {
    return '0원';
  }

  if (value >= 100_000_000) {
    const eok = value / 100_000_000;
    return `${formatDecimalNumber(eok)}억원`;
  }

  if (value >= 10_000) {
    const man = value / 10_000;
    return `${formatDecimalNumber(man)}만원`;
  }

  return `${Math.round(value).toLocaleString()}원`;
}

export function formatPercent(value: number): string {
  if (!value || value <= 0) {
    return '0%';
  }

  if (Number.isInteger(value)) {
    return `${value}%`;
  }

  return `${value.toFixed(1).replace(/\.0$/, '')}%`;
}

function formatDecimalNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1).replace(/\.0$/, '');
}
