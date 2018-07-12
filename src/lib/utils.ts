import * as dateFns from 'date-fns';

import * as Txns from './txns';

export function formatCurrency(dollars: Txns.Dollars): string {
  return Intl.NumberFormat(
    navigator.language || 'en-US',
    {minimumIntegerDigits: 1, minimumFractionDigits: 2, maximumFractionDigits: 2},
  ).format(dollars);
}

export function formatDate(date: string | Date): string {
  return dateFns.format(date, 'YYYY-MM-DD');
}
