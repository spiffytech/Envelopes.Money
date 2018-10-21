/* tslint:disable:no-console */

export function formatCurrency(dollars: number): string {
  return Intl.NumberFormat(
    navigator.language || 'en-US',
    {minimumIntegerDigits: 1, minimumFractionDigits: 2, maximumFractionDigits: 2},
  ).format(dollars);
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string') date = new Date(date);
  return date.toISOString().split('T')[0];
}

export function isString(t: string | any): t is string {
  return typeof t === 'string';
}
